const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const BUCKET = process.env.S3_BUCKET || 'km-documents';

let s3Client = null;
let sfnClient = null;

function getS3Client() {
  if (!s3Client) {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    s3Client = {
      client: new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' }),
      PutObjectCommand,
      GetObjectCommand,
      DeleteObjectCommand,
      ListObjectsV2Command,
      getSignedUrl
    };
  }
  return s3Client;
}

function getSFNClient() {
  if (!sfnClient) {
    const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
    sfnClient = {
      client: new SFNClient({ region: process.env.AWS_REGION || 'ap-northeast-1' }),
      StartExecutionCommand
    };
  }
  return sfnClient;
}

class DocumentService {
  constructor() {
    this.bucket = BUCKET;
    this.stepFunctionArn = process.env.STEP_FUNCTION_ARN;
  }

  async uploadDocument({ file, title, type, metadata = {} }) {
    const documentId = uuidv4();
    const key = `raw/${documentId}/${file.originalname}`;

    try {
      const s3 = getS3Client();
      await s3.client.send(new s3.PutObjectCommand({
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
    } catch (error) {
      logger.warn('S3 upload skipped (no connection)', { error: error.message });
    }

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
    if (!this.stepFunctionArn) return;

    try {
      const sfn = getSFNClient();
      await sfn.client.send(new sfn.StartExecutionCommand({
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
    try {
      const s3 = getS3Client();
      const command = new s3.GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      return s3.getSignedUrl(s3.client, command, { expiresIn: 3600 });
    } catch (error) {
      logger.warn('S3 signed URL failed', { error: error.message });
      return null;
    }
  }

  async getDocumentMetadata(documentId) {
    try {
      const s3 = getS3Client();
      const prefix = `raw/${documentId}/`;
      const response = await s3.client.send(new s3.ListObjectsV2Command({
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
    } catch (error) {
      logger.warn('S3 list failed', { error: error.message });
      return null;
    }
  }

  async deleteDocument(documentId, key) {
    try {
      const s3 = getS3Client();
      await s3.client.send(new s3.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));

      await s3.client.send(new s3.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key.replace('/raw/', '/processed/')
      }));
    } catch (error) {
      logger.warn('S3 delete failed', { error: error.message });
    }

    logger.info('Document deleted', { documentId });
    return { success: true };
  }

  async listDocuments({ prefix = '', maxKeys = 100 }) {
    try {
      const s3 = getS3Client();
      const response = await s3.client.send(new s3.ListObjectsV2Command({
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
    } catch (error) {
      logger.warn('S3 list failed', { error: error.message });
      return { documents: [], isTruncated: false, nextToken: null };
    }
  }
}

module.exports = new DocumentService();