const AppError = require('../../utils/appError.util');

describe('AppError', () => {
  it('should create an error with message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('Test', 500);
    expect(err).toBeInstanceOf(Error);
  });

  it('should have a stack trace', () => {
    const err = new AppError('Stack test', 400);
    expect(err.stack).toBeDefined();
  });
});
