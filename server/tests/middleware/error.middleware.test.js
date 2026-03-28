const AppError = require('../../utils/appError.util');

// Mock logger to avoid file writes during tests
jest.mock('../../utils/logger.util', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const globalErrorHandler = require('../../middleware/error.middleware');

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/test' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle AppError with correct status and message', () => {
    process.env.NODE_ENV = 'production';
    const err = new AppError('Not found', 404);
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
  });

  it('should handle unknown errors with 500 status', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Something broke');
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
  });

  it('should handle CastError', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Cast failed');
    err.name = 'CastError';
    err.path = '_id';
    err.value = 'invalid';
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle duplicate key error', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Duplicate');
    err.code = 11000;
    err.keyValue = { email: 'test@test.ge' };
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle JWT errors', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('jwt invalid');
    err.name = 'JsonWebTokenError';
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle expired JWT', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    globalErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should send full details in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new AppError('Dev error', 400);
    globalErrorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Dev error',
        stack: expect.any(String),
      })
    );
  });
});
