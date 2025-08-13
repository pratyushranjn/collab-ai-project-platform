const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// TODO: Implement chat routes
// Placeholder routes for future implementation

// Get chat messages for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), (req, res) => {
  res.json({
    success: true,
    message: 'Chat feature coming soon',
    data: { messages: [] }
  });
});

// Send message
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chat feature coming soon'
  });
});

module.exports = router;