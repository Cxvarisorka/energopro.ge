const AppError = require('../utils/appError.util');

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for "${field}". Please use another value.`, 400);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpired = () =>
  new AppError('Token has expired. Please log in again.', 401);

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  if (process.env.NODE_ENV !== 'development') {
    if (!isOperational) {
      console.error('UNEXPECTED ERROR:', err);
    }
    return res.status(statusCode).json({
      message: isOperational ? error.message : 'Something went wrong',
    });
  }

  // Development: send full error details
  console.error(err);
  res.status(statusCode).json({
    message: error.message,
    stack: error.stack,
    error: err,
  });
};

module.exports = globalErrorHandler;
