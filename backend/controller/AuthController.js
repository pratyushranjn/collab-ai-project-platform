const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const TokenBlacklist = require('../models/TokenBlacklist');
const asyncWrap = require('../utils/asyncWrap')
const ExpressError = require('../utils/ExpressError')

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    )
}

// Register User
const Register = asyncWrap(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new ExpressError(400, 'All fields are required');
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
        role: role || 'user'
    })


    const token = generateToken(user)

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
})


// Login User
const Login = asyncWrap(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ExpressError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ExpressError(400, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ExpressError(400, 'Invalid email or password');
    }

    const token = generateToken(user)

    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });

    console.log(token);

})


// Logout
const Logout = asyncWrap(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new ExpressError(400, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save token to blacklist
    await TokenBlacklist.create({
        token,
        expiresAt: new Date(decoded.exp * 1000) // exp from JWT payload
    });

    res.json({ success: true, message: 'Logged out successfully' });
});


module.exports = {
    register: Register,
    login: Login,
    logout: Logout
};
