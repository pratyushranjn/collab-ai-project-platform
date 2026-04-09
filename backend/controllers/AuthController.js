const jwt = require('jsonwebtoken');
const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');
const { clearTokenCookie, clearOAuthStateCookie, setTokenCookie } = require('../utils/Cookie.helper');

const validRoles = ['user', 'admin', 'project-manager'];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register User
const Register = asyncWrap(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ExpressError(400, 'All fields are required');
  }

  if (role && !validRoles.includes(role)) {
    throw new ExpressError(400, 'Invalid role specified');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.password) {
      throw new ExpressError(400, 'Email already registered. Please login.');
    } else {
      throw new ExpressError(400, 'Account exists. Please login using Google or GitHub.');
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Login User
const Login = asyncWrap(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ExpressError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ExpressError(400, 'User not found');
  }

  if (!user.password) {
    throw new ExpressError(400, "Please login using Google or GitHub");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ExpressError(400, 'Invalid email or password');
  }

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});


// Logout User
const Logout = asyncWrap(async (req, res) => {
  clearTokenCookie(res);
  clearOAuthStateCookie(res);
  res.json({ success: true, message: "Logged out successfully" });
});


const getMe = asyncWrap(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ success: true, data: user });
});


// const updateMe = asyncWrap(async (req, res) => {
//   const updates = req.body;
//   const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
//   res.json({ success: true, data: user });
// });


module.exports = {
  register: Register,
  login: Login,
  logout: Logout,
  getMe,
  generateToken
};
