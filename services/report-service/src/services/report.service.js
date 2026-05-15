const { marked } = require('marked');
const logger = require('../utils/logger');

const BUCKET = process.env.S3_BUCKET || 'km-documents';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022';

let s3Client = null;
let bedrockClient = null;

function getS3Client() {
  if (!s3Client) {
    const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    s3Client = {
      client: new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' }),
      PutObjectCommand,
      GetObjectCommand,
      getSignedUrl
    };
  }
  return s3Client;
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

const REPORT_TEMPLATES = {
  weekly: `请生成一份周报，包含以下部分：
1. 本周工作概述
2. 完成的任务
3. 遇到的问题及解决方案
4. 下周计划

周报日期：{date}`,
  monthly: `请生成一份月度报告，包含以下部分：
1. 本月业务概述
2. 关键成就与指标
3. 项目进展
4. 风险与挑战
5. 下月计划

报告期间：{period}`,
  summary: `请根据以下内容生成一份综合报告：
{content}

要求：
- 结构清晰，使用多级标题
- 包含数据摘要
- 提供建议与结论`
};

class ReportService {
  async generateReport({ type, title, date, period, content, data }) {
    const reportId = uuidv4();
    let prompt;

    switch (type) {
      case 'weekly':
        prompt = REPORT_TEMPLATES.weekly.replace('{date}', date || new Date().toISOString().split('T')[0]);
        break;
      case 'monthly':
        prompt = REPORT_TEMPLATES.monthly.replace('{period}', period || '本月');
        break;
      case 'summary':
        prompt = REPORT_TEMPLATES.summary.replace('{content}', content || '');
        break;
      default:
        prompt = content || '请生成一份报告';
    }

    const response = await this.invokeClaude(prompt);
    const markdown = response.content;
    const html = await marked(markdown);

    try {
      const s3 = getS3Client();
      await s3.client.send(new s3.PutObjectCommand({
        Bucket: BUCKET,
        Key: `reports/${reportId}/${title || 'report'}.html`,
        Body: html,
        ContentType: 'text/html'
      }));
    } catch (error) {
      logger.warn('S3 upload skipped (no connection)', { error: error.message });
    }

    logger.info('Report generated', { reportId, type, title });

    return {
      id: reportId,
      title: title || `${type} Report`,
      type,
      markdown,
      html,
      s3Key: `reports/${reportId}/${title || 'report'}.html`,
      createdAt: new Date().toISOString()
    };
  }

  async invokeClaude(prompt) {
    try {
      const bedrock = getBedrockClient();
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
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
      return { content: responseBody.content[0].text };
    } catch (error) {
      logger.error('Claude invocation failed', { error: error.message });
      return { content: 'AI服务暂时不可用，请稍后重试。' };
    }
  }

  async getReportUrl(reportId, key) {
    try {
      const s3 = getS3Client();
      const command = new s3.GetObjectCommand({ Bucket: BUCKET, Key: key });
      return s3.getSignedUrl(s3.client, command, { expiresIn: 3600 });
    } catch (error) {
      logger.warn('S3 signed URL failed', { error: error.message });
      return null;
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

module.exports = new ReportService();