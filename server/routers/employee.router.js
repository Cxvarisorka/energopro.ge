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
    .notEmpty().withMessage('პირადი ნომერი აუცილებელია')
    .isLength({ max: 50 }).withMessage('პირადი ნომერი მაქსიმუმ 50 სიმბოლო უნდა იყოს'),
  body('fullName')
    .notEmpty().withMessage('სახელი და გვარი აუცილებელია')
    .isLength({ max: 200 }).withMessage('სახელი და გვარი მაქსიმუმ 200 სიმბოლო უნდა იყოს'),
  body('department')
    .notEmpty().withMessage('დეპარტამენტი აუცილებელია')
    .isLength({ max: 200 }).withMessage('დეპარტამენტი მაქსიმუმ 200 სიმბოლო უნდა იყოს'),
  body('position')
    .notEmpty().withMessage('თანამდებობა აუცილებელია')
    .isLength({ max: 200 }).withMessage('თანამდებობა მაქსიმუმ 200 სიმბოლო უნდა იყოს'),
  body('workplace')
    .notEmpty().withMessage('სამუშაო ადგილი აუცილებელია'),
  body('qualificationGroup')
    .isIn(['I', 'II', 'III', 'IV', 'V']).withMessage('არასწორი კვალიფიკაციის ჯგუფი'),
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
