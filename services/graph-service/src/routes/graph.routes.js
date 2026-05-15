const express = require('express');
const { body, validationResult } = require('express-validator');
const graphService = require('../services/graph.service');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/entities',
  authenticate,
  [
    body('id').notEmpty(),
    body('type').notEmpty().isIn(['person', 'company', 'project', 'document', 'topic', 'event']),
    body('properties').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const entity = await graphService.addEntity(req.body);
      res.status(201).json(entity);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/relations',
  authenticate,
  [
    body('sourceId').notEmpty(),
    body('targetId').notEmpty(),
    body('relationType').notEmpty(),
    body('properties').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const relation = await graphService.addRelation(req.body);
      res.status(201).json(relation);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/entities/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const entity = await graphService.getEntity(req.params.id);
      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }
      res.json(entity);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/entities/:id/neighbors',
  authenticate,
  async (req, res, next) => {
    try {
      const { depth, relationType, limit } = req.query;
      const neighbors = await graphService.getNeighbors(req.params.id, {
        depth: depth ? parseInt(depth) : 1,
        relationType,
        limit: limit ? parseInt(limit) : 50
      });
      res.json({ neighbors });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/path',
  authenticate,
  async (req, res, next) => {
    try {
      const { sourceId, targetId, maxDepth } = req.query;
      if (!sourceId || !targetId) {
        return res.status(400).json({ error: 'sourceId and targetId are required' });
      }
      const paths = await graphService.findPath({ sourceId, targetId, maxDepth: maxDepth ? parseInt(maxDepth) : 5 });
      res.json({ paths });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/search',
  authenticate,
  [
    body('type').optional().isIn(['person', 'company', 'project', 'document', 'topic', 'event']),
    body('query').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, query, limit } = req.body;
      const entities = await graphService.searchEntities({ type, query, limit });
      res.json({ entities });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;