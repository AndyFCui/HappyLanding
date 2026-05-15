const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const logger = require('../utils/logger');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const authService = {
  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
  },

  async signIn(username, password) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    try {
      const response = await cognitoClient.send(command);
      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn
      };
    } catch (error) {
      logger.error('Sign in failed', { error: error.message, username });
      throw error;
    }
  },

  async signUp(email, password, givenName, familyName) {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: givenName },
        { Name: 'family_name', Value: familyName }
      ]
    });

    try {
      const response = await cognitoClient.send(command);
      return { userSub: response.UserSub, confirmed: false };
    } catch (error) {
      logger.error('Sign up failed', { error: error.message, email });
      throw error;
    }
  },

  async confirmSignUp(email, code) {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    });

    try {
      await cognitoClient.send(command);
      return { confirmed: true };
    } catch (error) {
      logger.error('Confirm sign up failed', { error: error.message, email });
      throw error;
    }
  }
};

module.exports = authService;