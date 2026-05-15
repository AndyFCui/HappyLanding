const logger = require('../utils/logger');

const CONNECTOR_LAMBDA_PREFIX = process.env.CONNECTOR_LAMBDA_PREFIX || 'km-connector-';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'km-event-bus';

const SUPPORTED_CONNECTORS = {
  dingtalk: { name: '钉钉', schedule: 'rate(6 hours)', lambda: `${CONNECTOR_LAMBDA_PREFIX}dingtalk` },
  sharepoint: { name: 'SharePoint', schedule: 'rate(4 hours)', lambda: `${CONNECTOR_LAMBDA_PREFIX}sharepoint` },
  confluence: { name: 'Confluence', schedule: 'rate(6 hours)', lambda: `${CONNECTOR_LAMBDA_PREFIX}confluence` },
  s3: { name: 'Amazon S3', schedule: 'event-based', lambda: `${CONNECTOR_LAMBDA_PREFIX}s3` }
};

class DatasourceService {
  async createDatasource({ type, name, config }) {
    if (!SUPPORTED_CONNECTORS[type]) {
      throw new Error(`Unsupported connector type: ${type}`);
    }

    const datasourceId = uuidv4();
    const connector = SUPPORTED_CONNECTORS[type];

    const datasource = {
      id: datasourceId,
      type,
      name,
      status: 'active',
      config: this.maskSensitiveData(config),
      lambdaArn: connector.lambda,
      schedule: connector.schedule,
      createdAt: new Date().toISOString(),
      lastSyncAt: null,
      syncStats: {
        successCount: 0,
        errorCount: 0,
        lastError: null
      }
    };

    await this.publishEvent({
      type: 'DatasourceCreated',
      datasource: {
        id: datasourceId,
        type,
        name
      }
    });

    logger.info('Datasource created', { datasourceId, type, name });

    return datasource;
  }

  async triggerSync(datasourceId, { mode = 'incremental' } = {}) {
    await this.publishEvent({
      type: 'SyncRequested',
      datasource: { id: datasourceId },
      sync: { mode, triggeredAt: new Date().toISOString() }
    });

    logger.info('Sync triggered', { datasourceId, mode });

    return { success: true, triggeredAt: new Date().toISOString() };
  }

  async getDatasource(datasourceId) {
    return {
      id: datasourceId,
      name: 'Sample Datasource',
      type: 'dingtalk',
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      syncStats: { successCount: 100, errorCount: 2, lastError: null }
    };
  }

  async listDatasources({ type, status, limit = 50 } = {}) {
    const datasources = Object.entries(SUPPORTED_CONNECTORS).map(([key, conn]) => ({
      id: key,
      type: key,
      name: conn.name,
      status: 'active',
      schedule: conn.schedule
    }));

    let filtered = datasources;
    if (type) {
      filtered = filtered.filter(d => d.type === type);
    }
    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }

    return { datasources: filtered.slice(0, limit) };
  }

  async pauseDatasource(datasourceId) {
    await this.publishEvent({
      type: 'DatasourcePaused',
      datasource: { id: datasourceId }
    });

    logger.info('Datasource paused', { datasourceId });
    return { success: true };
  }

  async resumeDatasource(datasourceId) {
    await this.publishEvent({
      type: 'DatasourceResumed',
      datasource: { id: datasourceId }
    });

    logger.info('Datasource resumed', { datasourceId });
    return { success: true };
  }

  async deleteDatasource(datasourceId) {
    await this.publishEvent({
      type: 'DatasourceDeleted',
      datasource: { id: datasourceId }
    });

    logger.info('Datasource deleted', { datasourceId });
    return { success: true };
  }

  async publishEvent({ type, ...detail }) {
    try {
      const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
      const eb = new EventBridgeClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });

      const command = new PutEventsCommand({
        Entries: [{
          EventBusName: EVENT_BUS_NAME,
          Source: 'km.datasource-service',
          DetailType: type,
          Detail: JSON.stringify({
            ...detail,
            timestamp: new Date().toISOString()
          })
        }]
      });

      await eb.send(command);
    } catch (error) {
      logger.warn('EventBridge publish skipped (no connection)', { error: error.message });
    }
  }

  maskSensitiveData(config) {
    const masked = { ...config };
    const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'privateKey'];

    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***';
      }
    }

    return masked;
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = new DatasourceService();