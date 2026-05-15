const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
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

router.post('/signin',
  body('username').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  validate,
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const tokens = await authService.signIn(username, password);
      logger.info('User signed in', { username, requestId: req.requestId });
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/signup',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('givenName').trim().notEmpty(),
  body('familyName').trim().notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { email, password, givenName, familyName } = req.body;
      const result = await authService.signUp(email, password, givenName, familyName);
      logger.info('User signed up', { email, requestId: req.requestId });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/confirm-signup',
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  validate,
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const result = await authService.confirmSignUp(email, code);
      logger.info('Email confirmed', { email, requestId: req.requestId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      userId: req.user.sub,
      email: req.user.email,
      givenName: req.user.given_name,
      familyName: req.user.family_name
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;