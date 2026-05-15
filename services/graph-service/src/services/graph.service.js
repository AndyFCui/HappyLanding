const gremlin = require('gremlin');
const Redis = require('ioredis');
const logger = require('../utils/logger');

const { DriverRemoteConnection } = gremlin.driver;
const { Graph } = gremlin.structure;
const { column, P, scope } = gremlin.process;

class GraphService {
  constructor() {
    this.connection = new DriverRemoteConnection(
      process.env.NEPTUNE_ENDPOINT || 'wss://localhost:8182/gremlin'
    );
    this.g = Graph().traversal().withRemote(this.connection);

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });

    this.cacheTTL = 900; // 15 minutes
  }

  async addEntity({ id, type, properties }) {
    const vertexLabel = type.charAt(0).toUpperCase() + type.slice(1);

    try {
      const result = await this.g.addV(vertexLabel)
        .property('id', id)
        .property('created_at', new Date().toISOString())
        .property('updated_at', new Date().toISOString())
        .iterate();

      for (const [key, value] of Object.entries(properties)) {
        await this.g.V().hasLabel(vertexLabel).has('id', id)
          .property(key, value)
          .iterate();
      }

      await this.invalidateCache(`entity:${id}`);
      logger.info('Entity added', { id, type });
      return { id, type, properties };
    } catch (error) {
      logger.error('Failed to add entity', { error: error.message, id, type });
      throw error;
    }
  }

  async addRelation({ sourceId, targetId, relationType, properties = {} }) {
    try {
      const result = await this.g.V().has('id', sourceId)
        .addE(relationType)
        .to(this.g.V().has('id', targetId))
        .property('created_at', new Date().toISOString())
        .iterate();

      for (const [key, value] of Object.entries(properties)) {
        await this.g.V().has('id', sourceId)
          .outE(relationType)
          .where(this.g.V().has('id', targetId))
          .property(key, value)
          .iterate();
      }

      await this.invalidateCache(`relations:${sourceId}`);
      logger.info('Relation added', { sourceId, targetId, relationType });
      return { sourceId, targetId, relationType, properties };
    } catch (error) {
      logger.error('Failed to add relation', { error: error.message });
      throw error;
    }
  }

  async getEntity(id) {
    const cacheKey = `entity:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const result = await this.g.V().has('id', id).valueMap(true).toList();

      if (result.length === 0) {
        return null;
      }

      const entity = this.mapVertexToEntity(result[0]);
      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(entity));
      return entity;
    } catch (error) {
      logger.error('Failed to get entity', { error: error.message, id });
      throw error;
    }
  }

  async getNeighbors(id, { depth = 1, relationType, limit = 50 } = {}) {
    const cacheKey = `neighbors:${id}:${depth}:${relationType}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      let traversal = this.g.V().has('id', id);

      if (depth === 1) {
        if (relationType) {
          traversal = traversal.out(relationType);
        } else {
          traversal = traversal.both();
        }
      } else {
        traversal = traversal.repeat(both()).times(depth);
        if (relationType) {
          traversal = traversal.where__.out(relationType);
        }
      }

      const result = await traversal
        .limit(limit)
        .valueMap(true)
        .toList();

      const neighbors = result.map(v => this.mapVertexToEntity(v));

      await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(neighbors));
      return neighbors;
    } catch (error) {
      logger.error('Failed to get neighbors', { error: error.message, id });
      throw error;
    }
  }

  async findPath({ sourceId, targetId, maxDepth = 5 }) {
    try {
      const result = await this.g.V().has('id', sourceId)
        .repeat(both())
        .until(this.g.V().has('id', targetId))
        .path()
        .limit(10)
        .toList();

      return result.map(path => ({
        nodes: path.objects.map(obj => obj.id || obj.label),
        edges: []
      }));
    } catch (error) {
      logger.error('Failed to find path', { error: error.message });
      throw error;
    }
  }

  async searchEntities({ type, query, limit = 50 }) {
    try {
      let traversal = this.g.V();

      if (type) {
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        traversal = traversal.hasLabel(label);
      }

      if (query) {
        traversal = traversal.where(
          P.textContains('title', query).or(P.textContains('name', query))
        );
      }

      const result = await traversal.limit(limit).valueMap(true).toList();

      return result.map(v => this.mapVertexToEntity(v));
    } catch (error) {
      logger.error('Failed to search entities', { error: error.message });
      throw error;
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
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async close() {
    await this.connection.close();
    this.redis.disconnect();
  }
}

module.exports = new GraphService();