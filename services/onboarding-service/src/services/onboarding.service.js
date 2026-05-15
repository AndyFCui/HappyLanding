const logger = require('../utils/logger');

const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022';

let opensearchClient = null;
let redisClient = null;
let bedrockClient = null;

function getOpenSearchClient() {
  if (!opensearchClient) {
    const { Client } = require('@opensearch-project/opensearch');
    opensearchClient = new Client({
      node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200'
    });
  }
  return opensearchClient;
}

function getRedisClient() {
  if (!redisClient) {
    const Redis = require('ioredis');
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      }
    });
    redisClient.on('error', () => {});
    redisClient.connect().catch(() => {});
  }
  return redisClient;
}

function getBedrockClient() {
  if (!bedrockClient) {
    const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock');
    bedrockClient = {
      client: new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' }),
      InvokeModelCommand
    };
  }
  return bedrockClient;
}

class OnboardingService {
  async exploreKeyword({ keyword, userId }) {
    const redis = getRedisClient();
    const cacheKey = `onboarding:${userId}:${keyword}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    const relatedDocs = await this.searchRelatedDocs(keyword);
    const explanation = await this.generateExplanation(keyword, relatedDocs);

    const result = {
      keyword,
      explanation,
      relatedTopics: relatedDocs.slice(0, 5).map(d => ({ id: d.id, title: d.title })),
      suggestedLearning: this.generateLearningPath(keyword, relatedDocs),
      createdAt: new Date().toISOString()
    };

    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(result));
    } catch {}

    return result;
  }

  async searchRelatedDocs(keyword) {
    try {
      const os = getOpenSearchClient();
      const response = await os.search({
        index: 'documents,kb_articles',
        body: {
          size: 10,
          query: {
            multi_match: {
              query: keyword,
              fields: ['title^3', 'content', 'tags^2']
            }
          },
          _source: ['id', 'title', 'type', 'content']
        }
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        title: hit._source.title,
        type: hit._source.type,
        snippet: hit._source.content?.substring(0, 200)
      }));
    } catch (error) {
      logger.warn('OpenSearch query failed', { error: error.message });
      return [];
    }
  }

  async generateExplanation(keyword, relatedDocs) {
    const docContext = relatedDocs.length > 0
      ? `相关文档：${relatedDocs.map(d => d.title).join('、')}`
      : '暂无相关文档';

    const prompt = `请用简洁易懂的语言解释"${keyword}"这个概念。
要求：
1. 用通俗的语言解释，避免过于专业的术语
2. 如果有相关的实际例子，请一并给出
3. 控制在200字以内

${docContext}`;

    return this.invokeClaude(prompt);
  }

  generateLearningPath(keyword, relatedDocs) {
    const path = [
      { step: 1, title: `了解${keyword}的基本概念`, type: 'concept' },
      { step: 2, title: `查看${keyword}相关文档`, type: 'document', count: Math.min(relatedDocs.length, 3) },
      { step: 3, title: `尝试搜索${keyword}相关内容`, type: 'search' }
    ];

    if (relatedDocs.length > 3) {
      path.push({ step: 4, title: '深入学习相关主题', type: 'explore' });
    }

    return path;
  }

  async getSuggestedTopics({ userId, department, role }) {
    const redis = getRedisClient();
    const cacheKey = `suggested-topics:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    const prompt = `作为一个新员工，请给出5-10个需要了解的关键主题领域。
员工部门：${department || '未知'}
员工角色：${role || '未知'}

请以JSON数组格式返回主题列表，每个主题包含：
- title: 主题名称
- description: 一句话描述
- priority: 优先级（high/medium/low）`;

    const content = await this.invokeClaude(prompt);
    let topics;
    try {
      topics = JSON.parse(content);
    } catch {
      topics = content.split('\n').filter(Boolean).map((t, i) => ({
        title: t.trim(),
        description: '相关主题',
        priority: i < 3 ? 'high' : 'medium'
      }));
    }

    try {
      await redis.setex(cacheKey, 86400, JSON.stringify(topics));
    } catch {}

    return topics;
  }

  async invokeClaude(prompt) {
    try {
      const bedrock = getBedrockClient();
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      };

      const command = new bedrock.InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await bedrock.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error) {
      logger.error('Claude invocation failed', { error: error.message });
      return 'AI服务暂时不可用，请稍后重试。';
    }
  }

  async close() {
    if (opensearchClient) {
      await opensearchClient.close();
    }
    if (redisClient) {
      redisClient.disconnect();
    }
  }
}

module.exports = new OnboardingService();