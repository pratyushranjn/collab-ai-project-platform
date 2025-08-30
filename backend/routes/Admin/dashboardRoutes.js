const router = require('express').Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const admin =  require('../../controllers/Admin/DashboardController');

router.use(protect, authorize('admin'));

// Dashboard + Users + Analytics
router.get('/dashboard/summary', admin.getDashboardSummary);
router.get('/users', admin.getUsers);
router.get('/analytics/projects/:projectId', admin.getProjectAnalytics);

module.exports = router;


