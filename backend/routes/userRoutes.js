const express = require('express');
const {
  getUserById,
  updateUser,
  updateUserRole,
  getAllUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.put('/:id/role', protect, updateUserRole);

// admin and project-manager
router.get('/', protect, authorize('admin', 'project-manager'), getAllUsers);

// Allow admins & project-managers
router.put('/users/:id/role', protect, authorize('admin', 'project-manager'), updateUserRole);


module.exports = router;