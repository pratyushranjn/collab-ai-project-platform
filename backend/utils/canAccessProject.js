const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task'); 

async function canAccessProject(user, projectId) {
  if (!user) return { ok: false, reason: 'unauth' };
  if (!mongoose.isValidObjectId(projectId)) return { ok: false, reason: 'bad-id' };

  const uid = (user._id || user.id).toString();

  if (user.role === 'admin') return { ok: true };

  const project = await Project.findById(projectId)
    .select('_id members projectManager')
    .lean();

  if (!project) return { ok: false, reason: 'not-found' };

  const members = Array.isArray(project.members) ? project.members : [];
  const isMember = members.some(m => m && m.toString() === uid);
  const isPM = project.projectManager && project.projectManager.toString() === uid;
  if (isMember || isPM) return { ok: true };

  const hasAssignedTask = await Task.exists({ project: projectId, assignedTo: uid });
  if (hasAssignedTask) return { ok: true };

  return { ok: false, reason: 'forbidden' };
}

module.exports = { canAccessProject };
