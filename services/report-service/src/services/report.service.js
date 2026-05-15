const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { marked } = require('marked');
const logger = require('../utils/logger');

const CLIENT = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const S3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });

const BUCKET = process.env.S3_BUCKET || 'km-documents';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022';

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

    const key = `reports/${reportId}/${title || 'report'}.html`;
    await S3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: html,
      ContentType: 'text/html'
    }));

    logger.info('Report generated', { reportId, type, title });

    return {
      id: reportId,
      title: title || `${type} Report`,
      type,
      markdown,
      html,
      s3Key: key,
      createdAt: new Date().toISOString()
    };
  }

  async invokeClaude(prompt) {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await CLIENT.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return { content: responseBody.content[0].text };
  }

  async getReportUrl(reportId, key) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(S3, command, { expiresIn: 3600 });
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