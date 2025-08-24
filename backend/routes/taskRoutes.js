const express = require('express');
const {
  createTask,
  getTaskByProject,
  getTaskById,
  updateTask,
  deleteTask,
  getTasks, 
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get tasks current user via ?mine=true
router.get('/', protect, getTasks);

// Get task by ID
router.get('/:id', protect, getTaskById);

// Create task (admin/project-manager only)
router.post('/projects/:projectId/tasks', protect, authorize('admin','project-manager'), createTask);

// Get tasks by project
router.get('/projects/:projectId/tasks', protect, getTaskByProject);

// Update/delete task (admin/project-manager only)
router.put('/:id', protect, authorize('admin','project-manager'), updateTask);
router.delete('/:id', protect, authorize('admin','project-manager'), deleteTask);

module.exports = router;
