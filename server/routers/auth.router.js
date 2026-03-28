const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('სწორი ელ. ფოსტა აუცილებელია'),
    body('password').isLength({ min: 6 }).withMessage('პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს'),
    body('fullName').notEmpty().withMessage('სახელი და გვარი აუცილებელია'),
    body('role').isIn(['admin', 'director', 'viewer']).withMessage('არასწორი როლი'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('სწორი ელ. ფოსტა აუცილებელია'),
    body('password').notEmpty().withMessage('პაროლი აუცილებელია'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);

module.exports = router;
