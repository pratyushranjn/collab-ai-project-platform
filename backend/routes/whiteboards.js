const express = require('express');
const {
  getProjectWhiteboards,
  getWhiteboard,
  createWhiteboard,
  updateWhiteboard,
  addObject,
  updateObject,
  deleteObject,
  updateCursor,
  clearWhiteboard
} = require('../controllers/whiteboardController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes are protected
router.use(protect);

// Test route to verify basic functionality
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Whiteboard routes working', user: req.user?.name });
});

// Validation middleware
const createWhiteboardValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
];

// Project-based routes with proper RBAC
// Get whiteboards for a project
router.get('/projects/:projectId', checkProjectPermission('viewer'), getProjectWhiteboards);

// Create whiteboard for a project
router.post('/projects/:projectId', checkProjectPermission('member'), createWhiteboardValidation, createWhiteboard);

// Individual whiteboard routes (still need project context for permissions)
// Get single whiteboard
router.get('/:id', getWhiteboard);

// Update whiteboard
router.put('/:id', updateWhiteboard);

// Add object to whiteboard
router.post('/:id/objects', addObject);

// Clear all objects from whiteboard
router.delete('/:id/objects', clearWhiteboard);

// Update object in whiteboard
router.put('/:id/objects/:objectId', updateObject);

// Delete object from whiteboard
router.delete('/:id/objects/:objectId', deleteObject);

// Update cursor position
router.put('/:id/cursor', updateCursor);

module.exports = router;