// routes/projectRoutes.js
const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/AuthMiddleware');

const router = express.Router();

// Admin only
router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

// Accessible to any authenticated user
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);

// Admin + Project Manager can manage members
router.post('/:id/members', protect, authorize('admin', 'project-manager'), addMember);
router.delete('/:id/members/:memberId', protect, authorize('admin', 'project-manager'), removeMember);

module.exports = router;
