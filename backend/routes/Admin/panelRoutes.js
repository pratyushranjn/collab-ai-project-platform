const router = require('express').Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const adminProjects = require('../../controllers/Admin/PanelController');
const blockDemoAdmin = require('../../middleware/blockDemoAdmin');

const {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../../controllers/projectController');

router.use(protect, authorize('admin'));

// Admin list/search/paginate projects
router.get('/projects', adminProjects.adminListProjects);
router.get('/projects/:id', getProjectById);

router.post('/projects', blockDemoAdmin, createProject);
router.put('/projects/:id', blockDemoAdmin, updateProject);
router.delete('/projects/:id', blockDemoAdmin, deleteProject);

// Members
router.post('/projects/:id/members', blockDemoAdmin, addMember);         // by memberId
router.post('/projects/:id/members/by-email', blockDemoAdmin, adminProjects.adminAddMemberByEmail);
router.delete('/projects/:id/members/:memberId', blockDemoAdmin, removeMember);

module.exports = router;
