const express = require('express');
const { body, query, validationResult } = require('express-validator');
const searchService = require('../services/search.service');
const { authenticate } = require('../middleware/authenticate');
const logger = require('../utils/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/',
  authenticate,
  [
    body('query').notEmpty().trim(),
    body('type').optional().isIn(['documents', 'messages', 'links', 'kb_articles', 'all']),
    body('page').optional().isInt({ min: 1 }),
    body('size').optional().isInt({ min: 1, max: 100 }),
    body('filters').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { query, type, page, size, filters, vector } = req.body;

      const results = vector
        ? await searchService.vectorSearch({ query, vector, type, size, filters })
        : await searchService.hybridSearch({ query, vector, type, page, size, filters });

      logger.info('Search performed', { query, type, resultsCount: results.results?.length, requestId: req.requestId });
      res.json(results);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/suggest',
  authenticate,
  [
    query('q').notEmpty().trim(),
    query('size').optional().isInt({ min: 1, max: 10 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { q, size = 5 } = req.query;
      const results = await searchService.search({ query: q, size, filters: {} });
      res.json({
        suggestions: results.results.map(r => ({ id: r.id, title: r.title, type: r.type }))
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;