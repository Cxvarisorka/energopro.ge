const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/appError.util');
const catchAsync = require('../utils/catchAsync.util');

const protect = catchAsync(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError('არაავტორიზებული მოთხოვნა, ტოკენი არ მოწოდებულა', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('ამ ტოკენის მომხმარებელი აღარ არსებობს', 401);
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('თქვენ არ გაქვთ ამ მოქმედების შესრულების უფლება', 403);
  }
  next();
};

module.exports = { protect, authorize };
