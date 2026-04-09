const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');

const DEMO_ADMIN_EMAIL = 'demo@aicollabhub.com';

function blockDemoAdmin(user) {
    if (String(user?.email || '').toLowerCase() === DEMO_ADMIN_EMAIL) {
        throw new ExpressError(403, 'Demo admin is not allowed to perform this action');
    }
}

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
    blockDemoAdmin(req.user);

    // Only allow self OR admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        throw new ExpressError(403, 'Not authorized to update this profile');
    }

    const updates = req.body || {};

    if (
        Object.prototype.hasOwnProperty.call(updates, 'email') &&
        String(req.user.email || '').toLowerCase() === DEMO_ADMIN_EMAIL
    ) {
        throw new ExpressError(403, 'Demo admin email cannot be updated');
    }

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
    blockDemoAdmin(req.user);
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