const Project = require('../../models/Project');
const User = require('../../models/user');
const asyncWrap = require('../../utils/asyncWrap');
const ExpressError = require('../../utils/ExpressError');

const adminListProjects = asyncWrap(async (req, res) => {
  const q     = (req.query.q || '').trim();
  const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);

  const match = q
    ? { $or: [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }] }
    : {};

  const total = await Project.countDocuments(match);

  const data = await Project.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },

    // tasks for counts
    { $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'project',
        as: 'tasks'
    }},

    // populate PM
    { $lookup: {
        from: 'users',
        localField: 'projectManager',
        foreignField: '_id',
        as: 'pm'
    }},
    { $unwind: { path: '$pm', preserveNullAndEmptyArrays: true }},

    // populate createdBy
    { $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'creator'
    }},
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true }},

    // add counts & shape fields
    { $addFields: {
        membersCount: { $size: { $ifNull: ['$members', []] } },
        totalTasks: { $size: '$tasks' },
        doneTasks: {
          $size: {
            $filter: {
              input: '$tasks',
              as: 't',
              cond: { $eq: ['$$t.status', 'done'] }
            }
          }
        },
        projectManager: '$pm',
        createdBy: '$creator'
    }},

    // final projection (trim payload)
    { $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        membersCount: 1,
        totalTasks: 1,
        doneTasks: 1,
        projectManager: { _id: 1, name: 1, email: 1 },
        createdBy: { _id: 1, name: 1, email: 1 }
        // omit raw members/tasks arrays to keep response light
    }}
  ]);

  res.json({
    success: true,
    page,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    total,
    data
  });
});

const adminAddMemberByEmail = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) throw new ExpressError(400, 'Email is required');

  const user = await User.findOne({ email }).select('_id');
  if (!user) throw new ExpressError(404, 'User not found with that email');

  const project = await Project.findByIdAndUpdate(
    id,
    { $addToSet: { members: user._id } },
    { new: true }
  )
    .populate('members', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('projectManager', 'name email role');

  if (!project) throw new ExpressError(404, 'Project not found');

  res.json({ success: true, message: 'Member added', data: project });
});

module.exports = { adminListProjects, adminAddMemberByEmail };
