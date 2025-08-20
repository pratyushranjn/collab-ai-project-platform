const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');

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
    throw new ExpressError(400, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
  });

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ExpressError(400, 'Invalid email or password');
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    token,
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
  res.clearCookie("token");
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
};
