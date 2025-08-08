const jwt = require('jsonwebtoken')
const ExpressError = require('../utils/ExpressError')
const TokenBlacklist = require('../models/TokenBlacklist');

// Middleware to check if user is authenticated
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return next(new ExpressError(401, 'Not authorized, no token'));
    }

    const token = authHeader.split(' ')[1];

    try {
        // Check if token is blacklisted
        const isBlacklisted = await TokenBlacklist.findOne({ token });
        if (isBlacklisted) {
            return next(new ExpressError(401, 'Token expired or logged out'));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (err) {
        return next(new ExpressError(401, 'Not authorized, invalid token'));
    }
};

// Middleware to check if user has specific role(s)
const authorize = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new ExpressError(403, 'Access denied: insufficient permissions'));
        }
        next()
    }
}

module.exports = { protect, authorize };