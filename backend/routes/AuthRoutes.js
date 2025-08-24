const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { register, login, logout, getMe, updateMe } = require('../controllers/AuthController'); 

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);

router.get('/me', protect, getMe);


module.exports = router; 
