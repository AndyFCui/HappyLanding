const express = require('express');
const { body, validationResult } = require('express-validator');
const onboardingService = require('../services/onboarding.service');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/explore',
  authenticate,
  [
    body('keyword').notEmpty().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { keyword } = req.body;
      const result = await onboardingService.exploreKeyword({
        keyword,
        userId: req.user.sub
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/suggested-topics',
  authenticate,
  async (req, res, next) => {
    try {
      const { department, role } = req.query;
      const topics = await onboardingService.getSuggestedTopics({
        userId: req.user.sub,
        department,
        role
      });
      res.json({ topics });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/learning-path/:topicId',
  authenticate,
  async (req, res, next) => {
    try {
      const { topicId } = req.params;
      res.json({
        topicId,
        steps: [
          { step: 1, title: '基础概念', duration: '30分钟' },
          { step: 2, title: '相关文档阅读', duration: '1小时' },
          { step: 3, title: '实践操作', duration: '2小时' }
        ]
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;