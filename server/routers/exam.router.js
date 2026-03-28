const express = require('express');
const { body } = require('express-validator');
const examController = require('../controllers/exam.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

const examValidation = [
  body('discipline').notEmpty().withMessage('დისციპლინა აუცილებელია'),
  body('examDate').isISO8601().withMessage('სწორი გამოცდის თარიღი აუცილებელია'),
  body('nextExamDate').isISO8601().withMessage('სწორი შემდეგი გამოცდის თარიღი აუცილებელია'),
  body('reason').notEmpty().withMessage('მიზეზი აუცილებელია'),
  body('grade').notEmpty().withMessage('შეფასება აუცილებელია'),
];

router
  .route('/')
  .get(examController.getExams)
  .post(authorize('admin', 'director'), examValidation, validate, examController.addExam);

router
  .route('/:examId')
  .put(authorize('admin', 'director'), examController.updateExam)
  .delete(authorize('admin', 'director'), examController.deleteExam);

module.exports = router;
