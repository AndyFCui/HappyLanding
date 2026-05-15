const { Client } = require('@opensearch-project/opensearch');
const Redis = require('ioredis');
const logger = require('../utils/logger');

const CACHE_TTL = 300; // 5 minutes

class SearchService {
  constructor() {
    this.opensearch = new Client({
      node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200',
      ssl: { rejectUnauthorized: false },
      auth: process.env.OPENSEARCH_USERNAME ? {
        username: process.env.OPENSEARCH_USERNAME,
        password: process.env.OPENSEARCH_PASSWORD
      } : undefined
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    });

    this.redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }

  async search({ query, type, page = 1, size = 20, filters = {} }) {
    const cacheKey = `search:${JSON.stringify({ query, type, page, size, filters })}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit', { cacheKey });
      return JSON.parse(cached);
    }

    const from = (page - 1) * size;
    const indices = this.getIndices(type);

    const searchBody = {
      from,
      size,
      query: this.buildQuery(query, filters),
      highlight: {
        fields: {
          title: {},
          content: { fragment_size: 150 }
        }
      },
      _source: ['id', 'title', 'type', 'created_at', 'metadata']
    };

    try {
      const response = await this.opensearch.search({
        index: indices,
        body: searchBody
      });

      const results = {
        total: response.hits.total.value,
        page,
        size,
        results: response.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          title: hit.highlight?.title?.[0] || hit._source.title,
          snippet: hit.highlight?.content?.[0] || hit._source.content?.substring(0, 200),
          type: hit._source.type,
          createdAt: hit._source.created_at,
          metadata: hit._source.metadata
        }))
      };

      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
      return results;

    } catch (error) {
      logger.error('Search failed', { error: error.message, query });
      throw error;
    }
  }

  async vectorSearch({ query, vector, type, size = 10, filters = {} }) {
    const indices = this.getIndices(type);

    const searchBody = {
      size,
      query: {
        bool: {
          must: vector ? [{
            knn: {
              vector_field: {
                vector,
                k: size
              }
            }
          }] : [{ match: { content: query } }],
          filter: Object.entries(filters).map(([field, value]) => ({
            term: { [field]: value }
          }))
        }
      },
      _source: ['id', 'title', 'type', 'created_at', 'metadata']
    };

    try {
      const response = await this.opensearch.search({
        index: indices,
        body: searchBody
      });

      return {
        total: response.hits.total.value,
        results: response.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          title: hit._source.title,
          type: hit._source.type,
          metadata: hit._source.metadata
        }))
      };
    } catch (error) {
      logger.error('Vector search failed', { error: error.message });
      throw error;
    }
  }

  async hybridSearch({ query, vector, type, page = 1, size = 20, filters = {} }) {
    const [textResults, vectorResults] = await Promise.all([
      this.search({ query, type, page, size, filters }),
      vector ? this.vectorSearch({ query, vector, type, size, filters }) : Promise.resolve({ results: [] })
    ]);

    const combined = this.mergeResults(textResults.results, vectorResults.results, size);

    return {
      total: textResults.total,
      page,
      size,
      results: combined
    };
  }

  mergeResults(textResults, vectorResults, limit) {
    const seen = new Set();
    const merged = [];

    for (const r of [...textResults, ...vectorResults]) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push({ ...r, source: textResults.includes(r) ? 'text' : 'vector' });
      }
      if (merged.length >= limit) break;
    }

    return merged;
  }

  getIndices(type) {
    const indexMap = {
      documents: 'documents',
      messages: 'messages',
      links: 'links',
      kb_articles: 'kb_articles'
    };
    return type ? (indexMap[type] || type) : 'documents,messages,links,kb_articles';
  }

  buildQuery(query, filters) {
    const must = [];
    const filter = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'content', 'tags^2'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    if (Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([field, value]) => {
        filter.push({ term: { [field]: value } });
      });
    }

    return must.length > 0 || filter.length > 0
      ? { bool: { must, filter } }
      : { match_all: {} };
  }

  async close() {
    await this.opensearch.close();
    this.redis.disconnect();
  }
}

module.exports = new SearchService();