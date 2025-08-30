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
const { protect, authorize } = require('../middleware/authMiddleware');
const { ensureProjectAccess } = require('../middleware/projectAccess'); 

const router = express.Router();

// Admin only
router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

// Authenticated users (details locked to members/PM/admin)
router.get('/', protect, getProjects);
router.get('/:id', protect, ensureProjectAccess, getProjectById);

// Admin + Project Manager can manage members
router.post('/:id/members', protect, authorize('admin', 'project-manager'), addMember);
router.delete('/:id/members/:memberId', protect, authorize('admin', 'project-manager'), removeMember);

module.exports = router;
