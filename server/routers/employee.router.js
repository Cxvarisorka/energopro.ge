const express = require('express');
const { body } = require('express-validator');
const employeeController = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../configs/cloudinary.config');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

const employeeValidation = [
  body('personalId').notEmpty().withMessage('Personal ID is required'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('workplace').notEmpty().withMessage('Workplace is required'),
  body('qualificationGroup').isIn(['I', 'II', 'III', 'IV', 'V']).withMessage('Invalid qualification group'),
];

router.get('/departments', employeeController.getDepartments);
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
