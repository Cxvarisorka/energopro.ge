const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../utils/cache.util');

const router = express.Router();

router.use(protect);

// Cache dashboard stats for 5 minutes
router.get('/stats', cacheMiddleware('dashboard:stats', 300), dashboardController.getStats);

module.exports = router;
