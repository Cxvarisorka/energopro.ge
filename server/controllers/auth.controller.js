const User = require('../models/user.model');
const AppError = require('../utils/appError.util');
const catchAsync = require('../utils/catchAsync.util');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/token.util');

exports.register = catchAsync(async (req, res) => {
  const { email, password, fullName, role } = req.body;

  const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  const allowedRoles = ['admin', 'director', 'viewer'];
  const sanitizedRole = allowedRoles.includes(role) ? role : 'viewer';

  const user = await User.create({ email, password, fullName, role: sanitizedRole });
  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.json({
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

exports.logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};
