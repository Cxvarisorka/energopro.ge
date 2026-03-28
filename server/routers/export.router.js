const express = require('express');
const exportController = require('../controllers/export.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/employees/csv', authorize('admin', 'director'), exportController.exportEmployeesCSV);

module.exports = router;
