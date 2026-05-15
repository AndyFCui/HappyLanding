const express = require('express');
const { body, validationResult } = require('express-validator');
const chatService = require('../services/chat.service');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/sessions',
  authenticate,
  [
    body('title').optional().isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title } = req.body;
      const session = await chatService.createSession({ userId: req.user.sub, title });
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/sessions/:sessionId/messages',
  authenticate,
  [
    body('content').notEmpty().isString(),
    body('context').optional().isArray()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { content, context } = req.body;
      const response = await chatService.sendMessage({
        sessionId,
        userId: req.user.sub,
        content,
        context
      });
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      const { limit, cursor } = req.query;
      const result = await chatService.listSessions(req.user.sub, {
        limit: limit ? parseInt(limit) : 20,
        cursor
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/sessions/:sessionId',
  authenticate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const session = await chatService.getSession(req.user.sub, sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;