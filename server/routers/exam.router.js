const express = require('express');
const { body } = require('express-validator');
const examController = require('../controllers/exam.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

const examValidation = [
  body('discipline').notEmpty().withMessage('Discipline is required'),
  body('examDate').isISO8601().withMessage('Valid exam date is required'),
  body('nextExamDate').isISO8601().withMessage('Valid next exam date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('grade').notEmpty().withMessage('Grade/result is required'),
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
