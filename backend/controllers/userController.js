const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');

// Get User Profile
const getUserById = asyncWrap(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        throw new ExpressError(404, 'User not found');
    }
    res.json({ success: true, data: user });
})

// Update User Profile (self or admin)
const updateUser = asyncWrap(async (req, res) => {

    // Only allow self OR admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        throw new ExpressError(403, 'Not authorized to update this profile');
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    ).select('-password')

    if (!user) throw new ExpressError(404, 'User not found')

    res.json({ success: true, data: user });
})


// Update User Role (Admin only)
const updateUserRole = asyncWrap(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ExpressError(403, 'Only admin can update roles');
    }
    const { role } = req.body
    const validRoles = ['user', 'admin', 'project-manager'];
    if (!validRoles.includes(role)) {
        throw new ExpressError(400, 'Invalid role');
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) throw new ExpressError(404, 'User not found');

    res.json({ success: true, message: 'Role updated', data: user });
})


// Get all users
const getAllUsers = asyncWrap(async (req, res) => {
    const role = req.user.role;

    if (!['admin', 'project-manager'].includes(role)) {
        throw new ExpressError(403, 'Only admin and project manager can view users');
    }

    // Fetch users excluding 'admin' role, and sort by name (A-Z)
    const users = await User.find({ role: { $ne: 'admin' } })
        .select('-password')
        .sort({ name: 1 }); 

    res.json({ success: true, count: users.length, data: users });
});

module.exports = {
    getUserById,
    updateUser,
    updateUserRole,
    getAllUsers,
};