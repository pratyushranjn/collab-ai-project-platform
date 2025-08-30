const router = require('express').Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const adminProjects = require('../../controllers/Admin/PanelController');

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

// Standard single-project ops (reuse existing controller)
router.get('/projects/:id', getProjectById);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Members
router.post('/projects/:id/members', addMember);                 // by memberId
router.post('/projects/:id/members/by-email', adminProjects.adminAddMemberByEmail);
router.delete('/projects/:id/members/:memberId', removeMember);

module.exports = router;
