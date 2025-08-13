const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get project tasks
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignee, priority, category } = req.query;

    // Build query
    const query = { project: projectId };
    if (status) query.status = status;
    if (assignee) query.assignee = assignee;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('watchers', 'name email avatar')
      .sort({ position: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      creator: req.user._id
    };

    // Set position for new task
    if (!taskData.position) {
      const lastTask = await Task.findOne({ 
        project: taskData.project, 
        status: taskData.status || 'todo' 
      }).sort({ position: -1 });
      
      taskData.position = lastTask ? lastTask.position + 1 : 0;
    }

    const task = await Task.create(taskData);
    await task.populate('assignee', 'name email avatar');
    await task.populate('creator', 'name email avatar');

    // Update project progress
    await updateProjectProgress(taskData.project);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_created', {
      task,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Track status change for progress calculation
    const oldStatus = task.status;
    const newStatus = updates.status;

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar')
     .populate('creator', 'name email avatar');

    // Update project progress if status changed
    if (oldStatus !== newStatus) {
      await updateProjectProgress(task.project);
    }

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_updated', {
      task: updatedTask,
      changes: updates,
      updatedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(id);

    // Update project progress
    await updateProjectProgress(task.project);

    // Emit to project room
    const io = req.app.get('socketio');
    io.to(`project_${task.project}`).emit('task_deleted', {
      taskId: id,
      deletedBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// @desc    Reorder tasks (for drag and drop)
// @route   PUT /api/tasks/reorder
// @access  Private
const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, status, position }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required'
      });
    }

    // Update all tasks in bulk
    const bulkOps = tasks.map(({ id, status, position }) => ({
      updateOne: {
        filter: { _id: id },
        update: { status, position }
      }
    }));

    await Task.bulkWrite(bulkOps);

    // Get project ID from first task
    const firstTask = await Task.findById(tasks[0].id);
    if (firstTask) {
      await updateProjectProgress(firstTask.project);

      // Emit to project room
      const io = req.app.get('socketio');
      io.to(`project_${firstTask.project}`).emit('tasks_reordered', {
        tasks,
        reorderedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Tasks reordered successfully'
    });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering tasks',
      error: error.message
    });
  }
};

// Helper function to update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks
};