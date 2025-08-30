const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { ensureProjectAccess } = require('../middleware/projectAccess');
const {
  getRoomMessages,
  getThread,
  postMessage,
} = require('../controllers/chatController');


router.get('/projects/:projectId/messages', protect, ensureProjectAccess, getRoomMessages);

router.get('/projects/:projectId/threads/:rootId', protect, ensureProjectAccess, getThread);

router.post('/projects/:projectId/messages', protect, ensureProjectAccess, postMessage);

module.exports = router;
