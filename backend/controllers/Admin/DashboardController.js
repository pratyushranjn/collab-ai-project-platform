const mongoose = require('mongoose');
const User = require('../../models/user');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const asyncWrap = require('../../utils/asyncWrap');
const ExpressError = require('../../utils/ExpressError');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

exports.getDashboardSummary = asyncWrap(async (_req, res) => {
  const [totalUsers, totalProjects, totalTasks] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments(),
  ]);

  const newUsersLast7d = await User.countDocuments({ createdAt: { $gte: daysAgo(7) } });
  const activeUsers7d = await User.countDocuments({ lastActiveAt: { $gte: daysAgo(7) } });

  const tasksByStatus = await Task.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  const start = daysAgo(13);
  const end = new Date();

  const tasksCreated = await Task.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } }, created: { $sum: 1 } } },
    { $project: { date: '$_id', created: 1, _id: 0 } },
    { $sort: { date: 1 } },
  ]);

  const tasksCompleted = await Task.aggregate([
    { $match: { updatedAt: { $gte: start, $lte: end }, status: 'done' } },
    { $group: { _id: { $dateToString: { date: '$updatedAt', format: '%Y-%m-%d' } }, completed: { $sum: 1 } } },
    { $project: { date: '$_id', completed: 1, _id: 0 } },
    { $sort: { date: 1 } },
  ]);

  // Top projects by open tasks
  const topProjects = await Task.aggregate([
    { $match: { status: { $ne: 'done' } } },
    { $group: { _id: '$project', openTasks: { $sum: 1 } } },
    { $sort: { openTasks: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
    { $unwind: '$project' },
    { $project: { projectId: '$_id', name: '$project.name', openTasks: 1, _id: 0 } },
  ]);

  res.json({
    totals: { users: totalUsers, projects: totalProjects, tasks: totalTasks },
    kpis: { newSignups7d: newUsersLast7d, activeUsers7d },
    breakdowns: { tasksByStatus },
    charts: { createdByDay: tasksCreated, completedByDay: tasksCompleted },
    leaders: { topProjects },
  });
});

exports.getUsers = asyncWrap(async (req, res) => {
  const { q = '', role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  if (role) filter.role = role;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ rows, total, page: Number(page), limit: Number(limit) });
});

exports.getProjectAnalytics = asyncWrap(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) throw new ExpressError('Invalid Project ID', 400);
  const pid = new mongoose.Types.ObjectId(projectId);

  const statusCounts = await Task.aggregate([
    { $match: { project: pid } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  const leadTimeStats = await Task.aggregate([
    { $match: { project: pid, status: 'done', createdAt: { $exists: true }, updatedAt: { $exists: true } } },
    { $project: { leadTimeHours: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60] } } },
    { $group: { _id: null, avgHours: { $avg: '$leadTimeHours' }, maxHours: { $max: '$leadTimeHours' } } },
    { $project: { _id: 0 } },
  ]);


const assigneeCounts = await Project.aggregate([
  { $match: { _id: pid } },
  { $project: { members: { $ifNull: ['$members', []] } } },
  { $unwind: '$members' },
  { $lookup: { from: 'users', localField: 'members', foreignField: '_id', as: 'member' } },
  { $unwind: '$member' },
  { $match: { 'member.role': 'user' } },   // only normal users
  {
    $lookup: {
      from: 'tasks',
      let: { memberId: '$members' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$project', pid] },
                { $in: ['$$memberId', '$assignedTo'] }
              ]
            }
          }
        },
        { $count: 'cnt' }
      ],
      as: 'taskCounts'
    }
  },
  {
    $project: {
      userId: '$member._id',
      name: '$member.name',
      email: '$member.email',
      role: '$member.role',
      count: { $ifNull: [{ $arrayElemAt: ['$taskCounts.cnt', 0] }, 0] }
    }
  }
]);

  res.json({
    statusCounts,
    assigneeCounts,                                      
    leadTime: leadTimeStats[0] || { avgHours: 0, maxHours: 0 },
  });
});





