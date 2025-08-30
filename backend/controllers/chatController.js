const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ExpressError = require('../utils/ExpressError');
const { notifyManyUsers } = require('../sockets/notify');


exports.getRoomMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { before, limit = 50 } = req.query;

    const where = { project: projectId, parentMessage: null };
    if (before) {
      const d = new Date(before);
      if (isNaN(d.getTime())) return next(new ExpressError(400, 'Invalid before date'));
      where.createdAt = { $lt: d };
    }

    const messages = await Chat.find(where)
      .sort({ createdAt: -1 })
      .limit(Math.min(+limit, 100))
      .populate('sender', 'name')
      .populate('replyCount');

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

exports.getThread = async (req, res, next) => {
  try {
    const { projectId, rootId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(rootId))
      return next(new ExpressError(400, 'Invalid rootId'));

    const [root, replies] = await Promise.all([
      Chat.findOne({ _id: rootId, project: projectId }).populate('sender', 'name'),
      Chat.find({ project: projectId, parentMessage: rootId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name'),
    ]);

    if (!root) return next(new ExpressError(404, 'Thread not found'));
    res.json({ root, replies });
  } catch (err) {
    next(err);
  }
};


exports.postMessage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const text = (req.body.text || '').trim();
    const parentMessage = req.body.parentMessage || null;

    if (!text) return next(new ExpressError(400, 'Message text is required'));
    if (parentMessage && !mongoose.Types.ObjectId.isValid(parentMessage))
      return next(new ExpressError(400, 'Invalid parentMessage'));

    if (parentMessage) {
      const root = await Chat.findOne({ _id: parentMessage, project: projectId }).select('_id');
      if (!root) return next(new ExpressError(404, 'Parent message not found in this project'));
    }

    const doc = await Chat.create({
      project: projectId,
      sender: req.user._id,
      text,
      parentMessage,
    });

    // Live update to users currently in this chat room 
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('message:new', {
        _id: doc._id,
        project: projectId,
        sender: req.user._id,
        text: doc.text,
        parentMessage: doc.parentMessage,
        createdAt: doc.createdAt,
      });

      // bell notification: PM + members + task assignees (exclude sender)
      const [project, assignees] = await Promise.all([
        Project.findById(projectId).select('name projectManager members').lean(),
        Task.find({ project: projectId }).distinct('assignedTo'),
      ]);

      const recipientsSet = new Set();
      if (project?.projectManager) recipientsSet.add(String(project.projectManager));
      if (Array.isArray(project?.members)) project.members.forEach(m => m && recipientsSet.add(String(m)));
      (assignees || []).forEach(a => a && recipientsSet.add(String(a)));

      const senderId = String(req.user._id);
      recipientsSet.delete(senderId);

      const recipients = Array.from(recipientsSet);

      const payload = {
        type: 'chat.message',
        createdAt: new Date().toISOString(),
        data: {
          projectId: String(projectId),
          projectName: project?.name || 'Project',
          messageId: String(doc._id),
          text: doc.text,
          sender: { _id: senderId, name: req.user.name || 'Someone' },
          parentMessage: doc.parentMessage || null,
        },
      };

      // Send bell notifications
      if (recipients.length) {
        notifyManyUsers(io, recipients, payload);
      } else {
        console.warn('[chat.notify(controller)] no recipients', { projectId, senderId });
      }
    }

    res.status(201).json({ message: doc });
  } catch (err) {
    next(err);
  }
};