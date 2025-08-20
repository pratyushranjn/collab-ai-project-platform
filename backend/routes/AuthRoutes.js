const express = require('express');
const { protect, authorize } = require('../middleware/AuthMiddleware');
const { register, login, logout, getMe, updateMe } = require('../controllers/AuthController'); 

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);

router.get('/me', protect, getMe);


module.exports = router; 
