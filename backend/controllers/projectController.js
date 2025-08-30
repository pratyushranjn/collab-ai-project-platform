const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/user');
const asyncWrap = require('../utils/asyncWrap');
const ExpressError = require('../utils/ExpressError');


// Helpers for inline ACL on members
function ensureAdminOrThisPM(user, project) {
  const isAdmin = user.role === 'admin';
  const isPM = project.projectManager && project.projectManager.toString() === user.id;
  if (!isAdmin && !isPM) {
    throw new ExpressError(403, 'Only admin or this project’s manager can manage members');
  }
}

// Create a new project (admin only)
const createProject = asyncWrap(async (req, res) => {
  if (req.user.role !== 'admin') throw new ExpressError(403, 'Unauthorized: Admins only');

  const { name, description, members = [], projectManager } = req.body;
  if (!name || !description) throw new ExpressError(400, 'Project name and description is required');

  // Validate PM if provided
  let pmId = null;
  if (projectManager) {
    const pmUser = await User.findById(projectManager);
    if (!pmUser) throw new ExpressError(404, 'Project manager user not found');
    if (pmUser.role !== 'project-manager') throw new ExpressError(400, 'User is not a project manager');
    pmId = pmUser._id;
  }

  const project = await Project.create({
    name,
    description,
    members,
    createdBy: req.user.id,
    ...(pmId ? { projectManager: pmId } : {}),
  });

  const populated = await Project.findById(project._id)
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  res.status(201).json({ success: true, data: populated });
});

// Get all projects (hide unrelated projects for non-admins)
const getProjects = asyncWrap(async (req, res) => {
  if (req.user.role === 'admin') {
    const projects = await Project.find({})
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('projectManager', 'name email role');
    return res.json({ success: true, data: projects });
  }

  // Projects where the user has any assigned task
  const taskProjectIds = await Task.distinct('project', { assignedTo: req.user.id });

  const projects = await Project.find({
    $or: [
      { _id: { $in: taskProjectIds } },           // assignee visibility
      { members: req.user.id },
      { createdBy: req.user.id },
      { projectManager: req.user.id },
    ],
  })
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  res.json({ success: true, data: projects });
});


// Get single project by id
const getProjectById = asyncWrap(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  if (!project) throw new ExpressError(404, 'Project not found');

  res.json({ success: true, data: project });
});

// Update project (admin only)
const updateProject = asyncWrap(async (req, res) => {
  if (req.user.role !== 'admin') throw new ExpressError(403, 'Unauthorized: Admins only');

  const updates = { ...req.body };

  // If updating PM, validate role
  if (updates.projectManager) {
    const pmUser = await User.findById(updates.projectManager);
    if (!pmUser) throw new ExpressError(404, 'Project manager user not found');
    if (pmUser.role !== 'project-manager') throw new ExpressError(400, 'User is not a project manager');
  }

  const project = await Project.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  if (!project) throw new ExpressError(404, 'Project not found');

  res.json({ success: true, data: project });
});

// Delete project (admin only)
const deleteProject = asyncWrap(async (req, res) => {
  if (req.user.role !== 'admin') throw new ExpressError(403, 'Unauthorized: Admins only');

  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw new ExpressError(404, 'Project not found');

  // Delete all tasks belonging to this project
  const { deletedCount } = await Task.deleteMany({ project: project._id });

  res.json({
    success: true,
    message: 'Project and its tasks deleted',
    deletedTasks: deletedCount,
  });
});


// Add member to project (inline ACL + idempotent)
const addMember = asyncWrap(async (req, res) => {
  const { memberId } = req.body;

  const project = await Project.findById(req.params.id).select('members projectManager');
  if (!project) throw new ExpressError(404, 'Project not found');

  // Inline resource-level check (keep your style, no new middleware file)
  ensureAdminOrThisPM(req.user, project);

  const user = await User.findById(memberId);
  if (!user) throw new ExpressError(404, 'User not found');

  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: memberId } }, // avoids duplicates
    { new: true }
  )
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  res.json({ success: true, message: 'Member added', data: updated });
});

// Remove member from project (inline ACL + idempotent)
const removeMember = asyncWrap(async (req, res) => {
  const { id, memberId } = req.params;

  const project = await Project.findById(id).select('members projectManager');
  if (!project) throw new ExpressError(404, 'Project not found');

  // Inline resource-level check
  ensureAdminOrThisPM(req.user, project);

  const updated = await Project.findByIdAndUpdate(
    id,
    { $pull: { members: memberId } },
    { new: true }
  )
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  if (!updated) throw new ExpressError(404, 'Project not found');
  res.json({ success: true, message: 'Member removed', data: updated });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};