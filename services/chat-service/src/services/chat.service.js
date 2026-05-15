const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const Redis = require('ioredis');
const logger = require('../utils/logger');

const CLIENT = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const DDB_CLIENT = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' }));

const SESSION_TABLE = process.env.DYNAMODB_TABLE || 'km-chat-sessions';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022';
const MAX_TOKENS = 4096;
const SYSTEM_PROMPT = `你是一个知识管理系统的AI助手。你的任务是帮助用户回答问题、生成报告和解释概念。
始终基于提供给你的上下文信息来回答。如果上下文中没有相关信息，请明确告知用户。`;

class ChatService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
  }

  async createSession({ userId, title }) {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    await DDB_CLIENT.send(new PutCommand({
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

    await DDB_CLIENT.send(new PutCommand({
      TableName: SESSION_TABLE,
      Item: {
        ...session,
        messages,
        updatedAt: new Date().toISOString()
      }
    }));

    return { content: response.content, sessionId };
  }

  async invokeClaude(prompt) {
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

    try {
      const response = await CLIENT.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return { content: responseBody.content[0].text };
    } catch (error) {
      logger.error('Claude invocation failed', { error: error.message });
      throw error;
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
    const result = await DDB_CLIENT.send(new GetCommand({
      TableName: SESSION_TABLE,
      Key: {
        PK: `user#${userId}`,
        SK: `session#${sessionId}`
      }
    }));

    return result.Item;
  }

  async listSessions(userId, { limit = 20, cursor } = {}) {
    const result = await DDB_CLIENT.send(new QueryCommand({
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
      sessions: result.Items.map(item => ({
        sessionId: item.sessionId,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      nextCursor: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : null
    };
  }

  async close() {
    this.redis.disconnect();
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