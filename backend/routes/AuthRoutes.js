const express = require('express');
const { protect, authorize } = require('../middleware/AuthMiddleware');
const { register, login, logout } = require('../controller/AuthController'); 

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);


// Role-protected routes Ex
router.get('/admin-data', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'This is admin-only data.' });
});

router.get('/project-manager', protect, authorize('admin', 'manager'), (req, res) => {
  res.json({ message: 'This is for admins or project managers.' });
});

router.get('/user-data', protect, (req, res) => {
  res.json({ message: 'This is for all logged-in users.' });
});


module.exports = router; 
