const logger = require('../utils/logger');

const { column, P, scope } = { column: 'c', P: class { static textContains(a,b) { return { type: 'textContains', a, b }; } }, scope: 's' };

let gremlinClient = null;
let redisClient = null;

function getGremlinClient() {
  if (!gremlinClient) {
    const gremlin = require('gremlin');
    const { DriverRemoteConnection } = gremlin.driver;
    const { Graph } = gremlin.structure;

    gremlinClient = {
      connection: new DriverRemoteConnection(
        process.env.NEPTUNE_ENDPOINT || 'ws://localhost:8182/gremlin'
      ),
      g: Graph().traversal().withRemote(
        new DriverRemoteConnection(process.env.NEPTUNE_ENDPOINT || 'ws://localhost:8182/gremlin')
      ),
      both: gremlin.process.column.both,
      ...gremlin.process
    };
  }
  return gremlinClient;
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

class GraphService {
  constructor() {
    this.cacheTTL = 900;
  }

  async addEntity({ id, type, properties }) {
    const vertexLabel = type.charAt(0).toUpperCase() + type.slice(1);

    try {
      const g = getGremlinClient().g;

      await g.addV(vertexLabel)
        .property('id', id)
        .property('created_at', new Date().toISOString())
        .property('updated_at', new Date().toISOString())
        .iterate();

      for (const [key, value] of Object.entries(properties)) {
        await g.V().hasLabel(vertexLabel).has('id', id)
          .property(key, value)
          .iterate();
      }

      await this.invalidateCache(`entity:${id}`);
      logger.info('Entity added', { id, type });
      return { id, type, properties };
    } catch (error) {
      logger.error('Failed to add entity', { error: error.message, id, type });
      return { id, type, properties, status: 'pending_sync' };
    }
  }

  async addRelation({ sourceId, targetId, relationType, properties = {} }) {
    try {
      const g = getGremlinClient().g;

      await g.V().has('id', sourceId)
        .addE(relationType)
        .to(g.V().has('id', targetId))
        .property('created_at', new Date().toISOString())
        .iterate();

      await this.invalidateCache(`relations:${sourceId}`);
      logger.info('Relation added', { sourceId, targetId, relationType });
      return { sourceId, targetId, relationType, properties };
    } catch (error) {
      logger.error('Failed to add relation', { error: error.message });
      return { sourceId, targetId, relationType, properties, status: 'pending_sync' };
    }
  }

  async getEntity(id) {
    const redis = getRedisClient();
    const cacheKey = `entity:${id}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    try {
      const g = getGremlinClient().g;
      const result = await g.V().has('id', id).valueMap(true).toList();

      if (result.length === 0) {
        return null;
      }

      const entity = this.mapVertexToEntity(result[0]);

      try {
        await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(entity));
      } catch {}

      return entity;
    } catch (error) {
      logger.error('Failed to get entity', { error: error.message, id });
      return { id, type: 'unknown', properties: {}, status: 'offline' };
    }
  }

  async getNeighbors(id, { depth = 1, relationType, limit = 50 } = {}) {
    const redis = getRedisClient();
    const cacheKey = `neighbors:${id}:${depth}:${relationType}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    try {
      const g = getGremlinClient().g;
      let traversal = g.V().has('id', id);

      if (depth === 1) {
        if (relationType) {
          traversal = traversal.out(relationType);
        } else {
          traversal = traversal.both();
        }
      }

      const result = await traversal.limit(limit).valueMap(true).toList();
      const neighbors = result.map(v => this.mapVertexToEntity(v));

      try {
        await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(neighbors));
      } catch {}

      return neighbors;
    } catch (error) {
      logger.error('Failed to get neighbors', { error: error.message, id });
      return [];
    }
  }

  async findPath({ sourceId, targetId, maxDepth = 5 }) {
    try {
      const g = getGremlinClient().g;
      const result = await g.V().has('id', sourceId)
        .repeat(g.V().both())
        .until(g.V().has('id', targetId))
        .path()
        .limit(10)
        .toList();

      return result.map(path => ({
        nodes: path.objects.map(obj => obj.id || obj.label),
        edges: []
      }));
    } catch (error) {
      logger.error('Failed to find path', { error: error.message });
      return [];
    }
  }

  async searchEntities({ type, query, limit = 50 }) {
    try {
      const g = getGremlinClient().g;
      let traversal = g.V();

      if (type) {
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        traversal = traversal.hasLabel(label);
      }

      const result = await traversal.limit(limit).valueMap(true).toList();
      return result.map(v => this.mapVertexToEntity(v));
    } catch (error) {
      logger.error('Failed to search entities', { error: error.message });
      return [];
    }
  }

  mapVertexToEntity(vertexMap) {
    const properties = {};
    const labels = vertexMap['~label'];

    for (const [key, value] of Object.entries(vertexMap)) {
      if (!['~id', '~label', '~properties'].includes(key) && key !== 'id') {
        properties[key] = Array.isArray(value) ? value[0] : value;
      }
    }

    return {
      id: vertexMap.id?.[0] || vertexMap['~id']?.toString(),
      type: labels?.[0] || labels,
      properties
    };
  }

  async invalidateCache(pattern) {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {}
  }

  async close() {
    if (gremlinClient?.connection) {
      await gremlinClient.connection.close();
    }
    if (redisClient) {
      redisClient.disconnect();
    }
  }
}

module.exports = new GraphService();