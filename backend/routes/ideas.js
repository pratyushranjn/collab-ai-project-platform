const express = require('express');
const {
  generateIdeas,
  getProjectIdeas,
  createIdea,
  voteOnIdea,
  addComment
} = require('../controllers/ideaController');
const { protect } = require('../middleware/authMiddleware');
const { checkProjectPermission } = require('../middleware/rbacMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const generateIdeasValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Prompt must be between 10 and 500 characters'),
  body('projectId')
    .isMongoId()
    .withMessage('Valid project ID is required')
];

const createIdeaValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('project')
    .isMongoId()
    .withMessage('Valid project ID is required')
];

// Generate AI ideas
router.post('/generate', generateIdeasValidation, generateIdeas);

// Get ideas for a project
router.get('/project/:projectId', checkProjectPermission('viewer'), getProjectIdeas);

// Create manual idea
router.post('/', createIdeaValidation, createIdea);

// Vote on idea
router.post('/:id/vote', 
  body('type').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote'),
  voteOnIdea
);

// Add comment to idea
router.post('/:id/comments',
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  addComment
);

module.exports = router;