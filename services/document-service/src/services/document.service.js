const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class DocumentService {
  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    this.sfn = new SFNClient({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    this.bucket = process.env.S3_BUCKET || 'km-documents';
    this.stepFunctionArn = process.env.STEP_FUNCTION_ARN;
  }

  async uploadDocument({ file, title, type, metadata = {} }) {
    const documentId = uuidv4();
    const key = `raw/${documentId}/${file.originalname}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        documentId,
        title,
        type,
        ...metadata
      }
    }));

    if (this.stepFunctionArn) {
      await this.triggerProcessingPipeline({ documentId, key, title, type });
    }

    logger.info('Document uploaded', { documentId, title, type });

    return {
      id: documentId,
      title,
      type,
      key,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    };
  }

  async triggerProcessingPipeline({ documentId, key, title, type }) {
    try {
      await this.sfn.send(new StartExecutionCommand({
        stateMachineArn: this.stepFunctionArn,
        input: JSON.stringify({
          documentId,
          s3Key: key,
          title,
          type,
          timestamp: new Date().toISOString()
        })
      }));
      logger.info('Processing pipeline triggered', { documentId });
    } catch (error) {
      logger.error('Failed to trigger processing pipeline', { error: error.message, documentId });
    }
  }

  async getPresignedDownloadUrl(documentId, key) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async getDocumentMetadata(documentId) {
    const prefix = `raw/${documentId}/`;
    const response = await this.s3.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    }));

    if (!response.Contents || response.Contents.length === 0) {
      return null;
    }

    const file = response.Contents[0];
    return {
      id: documentId,
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      eTag: file.ETag
    };
  }

  async deleteDocument(documentId, key) {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));

    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key.replace('/raw/', '/processed/')
    }));

    logger.info('Document deleted', { documentId });
    return { success: true };
  }

  async listDocuments({ prefix = '', maxKeys = 100 }) {
    const response = await this.s3.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys
    }));

    return {
      documents: (response.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      })),
      isTruncated: response.IsTruncated,
      nextToken: response.NextContinuationToken
    };
  }
}

module.exports = new DocumentService();