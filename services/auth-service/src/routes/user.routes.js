const express = require('express');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({
    userId: req.user.sub,
    email: req.user.email,
    givenName: req.user.given_name,
    familyName: req.user.family_name,
    roles: req.user['cognito:groups'] || []
  });
});

module.exports = router;