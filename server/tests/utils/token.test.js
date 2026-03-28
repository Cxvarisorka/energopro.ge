const jwt = require('jsonwebtoken');

// Set env before requiring module
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-64chars-long-abcdefghijklmnop';
process.env.JWT_EXPIRES_IN = '1d';

const { generateToken, setTokenCookie, clearTokenCookie } = require('../../utils/token.util');

describe('Token Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT', () => {
      const token = generateToken('user123');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe('user123');
    });

    it('should set expiry', () => {
      const token = generateToken('user123');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('setTokenCookie', () => {
    it('should set cookie on response', () => {
      const res = { cookie: jest.fn() };
      setTokenCookie(res, 'test-token');
      expect(res.cookie).toHaveBeenCalledWith('token', 'test-token', expect.objectContaining({
        httpOnly: true,
        path: '/',
      }));
    });
  });

  describe('clearTokenCookie', () => {
    it('should clear cookie on response', () => {
      const res = { cookie: jest.fn() };
      clearTokenCookie(res);
      expect(res.cookie).toHaveBeenCalledWith('token', '', expect.objectContaining({
        maxAge: 0,
      }));
    });
  });
});
