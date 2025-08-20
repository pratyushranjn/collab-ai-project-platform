const Project = require('../models/Project')
const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap')
const ExpressError = require('../utils/ExpressError')

// Create a new project (admin only)
const createProject = asyncWrap(async (req, res) => {
    if (req.user.role != 'admin') {
        throw new ExpressError(403, 'Unauthorized: Admins only');
    }

    const { name, description, members } = req.body;

    if (!name || !description) {
        throw new ExpressError(400, 'Project name and description is required');
    }

    const project = await Project.create({
        name, description,
        members,
        createdBy: req.user.id
    })

    res.status(201).json({ success: true, data: project });

})

// Get all projects
const getProjects = asyncWrap(async (req, res) => {
    const projects = await Project.find()
        .populate('members', 'name email role')
        .populate('crestedBy', 'name email')

    res.json({ success: true, data: projects });

})

// Get single project by id
const getProjectById = asyncWrap(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('members', 'name email role')
        .populate('createdBy', 'name email');

    if (!project) {
        throw new ExpressError(404, 'Project not found');
    }

    res.json({ success: true, data: project });
})


// Update project (admin only)
const updateProject = asyncWrap(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ExpressError(403, 'Unauthorized: Admins only');
    }

    const updates = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    })

    if (!project) {
        throw new ExpressError(404, 'Project not found');
    }

    res.json({ success: true, data: project });
})


// Delete project (admin only)
const deleteProject = asyncWrap(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ExpressError(403, 'Unauthorized: Admins only');
    }

    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
        throw new ExpressError(404, 'Project not found');
    }

    res.json({ success: true, message: 'Project deleted' });

})


// Add member to project
const addMember = asyncWrap(async (req, res) => {
    const { memberId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) throw new ExpressError(404, 'Project not found');

    const user = await User.findById(memberId);
    if (!user) throw new ExpressError(404, 'User not found');

    if (project.members.includes(memberId)) {
        throw new ExpressError(400, 'User already a member of this project');
    }

    project.members.push(memberId);
    await project.save();

    res.json({ success: true, message: 'Member added', data: project });
});


// Remove member from project
const removeMember = asyncWrap(async (req, res) => {
    const { id, memberId } = req.params;
    const project = await Project.findById(id);
    if (!project) throw new ExpressError(404, 'Project not found');

    if (!project.members.includes(memberId)) {
        throw new ExpressError(400, 'User is not a member of this project');
    }

    project.members = project.members.filter(
        (member) => member.toString() !== memberId
    );
    await project.save();

    res.json({ success: true, message: 'Member removed', data: project });
})


module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
};