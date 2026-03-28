const express = require('express');
const { body } = require('express-validator');
const employeeController = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../configs/cloudinary.config');
const validate = require('../middleware/validate.middleware');
const { cacheMiddleware } = require('../utils/cache.util');

const router = express.Router();

router.use(protect);

const employeeValidation = [
  body('personalId')
    .notEmpty().withMessage('Personal ID is required')
    .isLength({ max: 50 }).withMessage('Personal ID must be at most 50 characters'),
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 200 }).withMessage('Full name must be at most 200 characters'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 200 }).withMessage('Department must be at most 200 characters'),
  body('position')
    .notEmpty().withMessage('Position is required')
    .isLength({ max: 200 }).withMessage('Position must be at most 200 characters'),
  body('workplace')
    .notEmpty().withMessage('Workplace is required'),
  body('qualificationGroup')
    .isIn(['I', 'II', 'III', 'IV', 'V']).withMessage('Invalid qualification group'),
];

// Cache departments for 10 minutes
router.get('/departments', cacheMiddleware('departments', 600), employeeController.getDepartments);
router.get('/search', employeeController.searchByPersonalId);

router
  .route('/')
  .get(employeeController.getEmployees)
  .post(
    authorize('admin', 'director'),
    upload.single('photo'),
    employeeValidation,
    validate,
    employeeController.createEmployee
  );

router
  .route('/:id')
  .get(employeeController.getEmployee)
  .put(authorize('admin', 'director'), upload.single('photo'), employeeController.updateEmployee)
  .delete(authorize('admin', 'director'), employeeController.deleteEmployee);

module.exports = router;
