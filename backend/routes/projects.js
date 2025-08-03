const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  addTeamMember,
  removeTeamMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { projectValidation } = require('../utils/validators');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(projectValidation, createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject);

router.route('/:id/team')
  .post(addTeamMember);

router.route('/:id/team/:userId')
  .delete(removeTeamMember);

module.exports = router;