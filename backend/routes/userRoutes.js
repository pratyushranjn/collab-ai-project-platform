const express = require('express');
const {
  getUserById,
  updateUser,
  updateUserRole,
  getAllUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/AuthMiddleware');
const router = express.Router();

router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.put('/:id/role', protect, updateUserRole);

// Allow only admins
router.get('/admin/users', protect, authorize('admin'), getAllUsers);

// Allow admins & project-managers
router.put('/users/:id/role', protect, authorize('admin', 'project-manager'), updateUserRole);


module.exports = router;