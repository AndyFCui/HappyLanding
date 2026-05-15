const Redis = require('ioredis');
const logger = require('../utils/logger');

const SESSION_TABLE = process.env.DYNAMODB_TABLE || 'km-chat-sessions';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022';
const MAX_TOKENS = 4096;
const SYSTEM_PROMPT = `你是一个知识管理系统的AI助手。你的任务是帮助用户回答问题、生成报告和解释概念。
始终基于提供给你的上下文信息来回答。如果上下文中没有相关信息，请明确告知用户。`;

let bedrockClient = null;
let ddbClient = null;

function getBedrockClient() {
  if (!bedrockClient) {
    const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock');
    bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
  }
  return bedrockClient;
}

function getDDBClient() {
  if (!ddbClient) {
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' }));
  }
  return ddbClient;
}

class ChatService {
  constructor() {
    this.redis = null;
    this._initRedis();
  }

  _initRedis() {
    try {
      this.redis = new Redis({
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

      this.redis.on('error', (err) => {
        logger.debug('Redis connection error (non-fatal)', { error: err.message });
      });

      this.redis.connect().catch(() => {
        logger.debug('Redis not available, continuing without cache');
      });
    } catch (err) {
      logger.debug('Redis initialization skipped');
    }
  }

  async createSession({ userId, title }) {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    try {
      await getDDBClient().send(new (require('@aws-sdk/lib-dynamodb').PutCommand)({
        TableName: SESSION_TABLE,
        Item: {
          PK: `user#${userId}`,
          SK: `session#${sessionId}`,
          sessionId,
          userId,
          title: title || '新对话',
          createdAt: now,
          updatedAt: now,
          messages: []
        }
      }));
    } catch (error) {
      logger.warn('DynamoDB write skipped (no connection)', { error: error.message });
    }

    return { sessionId, title: title || '新对话', createdAt: now };
  }

  async sendMessage({ sessionId, userId, content, context }) {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const messages = session.messages || [];
    messages.push({ role: 'user', content, timestamp: new Date().toISOString() });

    const prompt = this.buildPrompt(messages, context);
    const response = await this.invokeClaude(prompt);
    messages.push({ role: 'assistant', content: response.content, timestamp: new Date().toISOString() });

    try {
      await getDDBClient().send(new (require('@aws-sdk/lib-dynamodb').PutCommand)({
        TableName: SESSION_TABLE,
        Item: {
          ...session,
          messages,
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      logger.warn('DynamoDB write skipped', { error: error.message });
    }

    return { content: response.content, sessionId };
  }

  async invokeClaude(prompt) {
    try {
      const { InvokeModelCommand } = require('@aws-sdk/client-bedrock');

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      };

      const command = new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await getBedrockClient().send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return { content: responseBody.content[0].text };
    } catch (error) {
      logger.error('Claude invocation failed', { error: error.message });
      return { content: 'AI服务暂时不可用，请稍后重试。' };
    }
  }

  buildPrompt(messages, context) {
    let prompt = '';

    if (context && context.length > 0) {
      prompt += '\n\n参考信息：\n';
      context.forEach((ctx, i) => {
        prompt += `[${i + 1}] ${ctx.content}\n`;
      });
      prompt += '\n';
    }

    prompt += '\n对话历史：\n';
    messages.slice(-10).forEach(msg => {
      prompt += `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}\n`;
    });

    prompt += '\n请基于参考信息回答用户的问题。';
    return prompt;
  }

  async getSession(userId, sessionId) {
    try {
      const { GetCommand } = require('@aws-sdk/lib-dynamodb');
      const result = await getDDBClient().send(new GetCommand({
        TableName: SESSION_TABLE,
        Key: {
          PK: `user#${userId}`,
          SK: `session#${sessionId}`
        }
      }));
      return result.Item;
    } catch (error) {
      logger.warn('DynamoDB read skipped', { error: error.message });
      return { sessionId, userId, title: '新对话', messages: [] };
    }
  }

  async listSessions(userId, { limit = 20, cursor } = {}) {
    try {
      const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
      const result = await getDDBClient().send(new QueryCommand({
        TableName: SESSION_TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `user#${userId}`,
          ':sk': 'session#'
        },
        Limit: limit,
        ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined
      }));

      return {
        sessions: (result.Items || []).map(item => ({
          sessionId: item.sessionId,
          title: item.title,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })),
        nextCursor: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null
      };
    } catch (error) {
      logger.warn('DynamoDB query skipped', { error: error.message });
      return { sessions: [], nextCursor: null };
    }
  }

  async close() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = new ChatService();