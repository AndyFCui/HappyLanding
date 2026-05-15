const express = require('express');
const { body, validationResult } = require('express-validator');
const reportService = require('../services/report.service');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/generate',
  authenticate,
  [
    body('type').notEmpty().isIn(['weekly', 'monthly', 'summary', 'custom']),
    body('title').optional().isString(),
    body('date').optional().isString(),
    body('period').optional().isString(),
    body('content').optional().isString(),
    body('data').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, title, date, period, content, data } = req.body;
      const report = await reportService.generateReport({ type, title, date, period, content, data });
      res.status(201).json(report);
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
      res.json({ id, status: 'available' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;