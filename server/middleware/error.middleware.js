const AppError = require('../utils/appError.util');
const logger = require('../utils/logger.util');

const handleCastError = (err) =>
  new AppError(`არასწორი ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`"${field}" ველის მნიშვნელობა უკვე არსებობს. გამოიყენეთ სხვა მნიშვნელობა.`, 400);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`ვალიდაციის შეცდომა: ${messages.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('არასწორი ტოკენი. გთხოვთ თავიდან შეხვიდეთ.', 401);

const handleJWTExpired = () =>
  new AppError('ტოკენის ვადა ამოიწურა. გთხოვთ თავიდან შეხვიდეთ.', 401);

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  if (!isOperational) {
    logger.error('Unexpected error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: err.message,
      stack: err.stack,
    });
  } else if (statusCode >= 500) {
    logger.error('Server error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: error.message,
    });
  } else {
    logger.warn('Client error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message: error.message,
    });
  }

  if (process.env.NODE_ENV !== 'development') {
    return res.status(statusCode).json({
      message: isOperational ? error.message : 'დაფიქსირდა შეცდომა',
    });
  }

  // Development: send full error details
  res.status(statusCode).json({
    message: error.message,
    stack: error.stack,
    error: err,
  });
};

module.exports = globalErrorHandler;
