/**
 * Mock User Middleware
 * 
 * Injects a fixed user ID into every request for v1 development.
 * Real authentication will replace this in a future phase.
 */
const MOCK_USER_ID = '000000000000000000000001';

const mockUserMiddleware = (req, res, next) => {
  req.userId = MOCK_USER_ID;
  next();
};

module.exports = mockUserMiddleware;
module.exports.MOCK_USER_ID = MOCK_USER_ID;
