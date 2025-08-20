const jwt = require('jsonwebtoken')
const ExpressError = require('../utils/ExpressError')
const User = require('../models/user');

// Middleware to check if user is authenticated
const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ExpressError(401, 'Not authorized, no token'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ExpressError(401, 'User not found or removed'));
    }

    req.user = user;
    next();
  } catch {
    return next(new ExpressError(401, "Token invalid or expired"));
  }
};


// Middleware to check if user has specific role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ExpressError(403, 'Access denied: insufficient permissions'));
    }
    next()
  }
}

module.exports = { protect, authorize };