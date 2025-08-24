const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');

// Create New Task
const createTask = asyncWrap(async (req, res) => {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority } = req.body; 

    const project = await Project.findById(projectId);
    if (!project) throw new ExpressError(404, 'Project not found');

    const task = await Task.create({
        title,
        description,
        project: projectId,
        assignedTo,
        createdBy: req.user.id,
        priority: priority || 'medium', 
    });

    res.status(201).json({ success: true, data: task });
});

// Get All Tasks for a Project
const getTaskByProject = asyncWrap(async (req, res) => {
    const { projectId } = req.params;

    // Fetch tasks with populated user data and including priority field
    const tasks = await Task.find({ project: projectId })
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email');

    res.json({ success: true, count: tasks.length, data: tasks });
});


// Get Task Details
const getTaskById = asyncWrap(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

    if (!task) throw new ExpressError(404, 'Task not found');

    res.json({ success: true, data: task });
});


// GET tasks?mine=true
const getTasks = asyncWrap(async (req, res) => {
    const query = req.query.mine === 'true' ? { assignedTo: req.user._id } : {};
    const tasks = await Task.find(query)
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

    res.json({ success: true, count: tasks.length, data: tasks });
});


// Update Task
const updateTask = asyncWrap(async (req, res) => {
    const updates = req.body;
    console.log(updates);

    // Update task (including priority if provided)
    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });

    if (!task) throw new ExpressError(404, 'Task not found');

    res.json({ success: true, data: task });
});


// Delete Task
const deleteTask = asyncWrap(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw new ExpressError(404, 'Task not found');

    res.json({ success: true, message: 'Task deleted' });
});

module.exports = {
    createTask,
    getTaskByProject,
    getTaskById,
    getTasks,
    updateTask,
    deleteTask,
};
