const express = require('express');
const {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { taskValidation } = require('../utils/validators');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get tasks for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), getProjectTasks);

// Create task
router.post('/', taskValidation, createTask);

// Update task
router.put('/:id', updateTask);

// Delete task
router.delete('/:id', deleteTask);

// Reorder tasks (for drag and drop)
router.put('/reorder', reorderTasks);

module.exports = router;