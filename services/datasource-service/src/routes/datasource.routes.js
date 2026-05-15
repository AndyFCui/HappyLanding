const express = require('express');
const { body, validationResult } = require('express-validator');
const datasourceService = require('../services/datasource.service');
const { authenticate } = require('../middleware/authenticate');

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
    body('type').notEmpty().isIn(['dingtalk', 'sharepoint', 'confluence', 's3', 'webdav']),
    body('name').notEmpty().trim(),
    body('config').notEmpty().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, name, config } = req.body;
      const datasource = await datasourceService.createDatasource({ type, name, config });
      res.status(201).json(datasource);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/',
  authenticate,
  async (req, res, next) => {
    try {
      const { type, status, limit } = req.query;
      const result = await datasourceService.listDatasources({
        type,
        status,
        limit: limit ? parseInt(limit) : 50
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const datasource = await datasourceService.getDatasource(id);
      if (!datasource) {
        return res.status(404).json({ error: 'Datasource not found' });
      }
      res.json(datasource);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/sync',
  authenticate,
  [
    body('mode').optional().isIn(['full', 'incremental'])
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { mode } = req.body;
      const result = await datasourceService.triggerSync(id, { mode });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/pause',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await datasourceService.pauseDatasource(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/resume',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await datasourceService.resumeDatasource(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await datasourceService.deleteDatasource(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;