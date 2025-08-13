const Whiteboard = require('../models/Whiteboard');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get project whiteboards
// @route   GET /api/whiteboards/project/:projectId
// @access  Private
const getProjectWhiteboards = async (req, res) => {
  try {
    const { projectId } = req.params;

    const whiteboards = await Whiteboard.find({ project: projectId })
      .populate('creator', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: whiteboards.length,
      data: { whiteboards }
    });
  } catch (error) {
    console.error('Get project whiteboards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching whiteboards',
      error: error.message
    });
  }
};

// @desc    Get single whiteboard
// @route   GET /api/whiteboards/:id
// @access  Private
const getWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;

    const whiteboard = await Whiteboard.findById(id)
      .populate('creator', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('canvas.objects.createdBy', 'name email avatar');

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    res.json({
      success: true,
      data: { whiteboard }
    });
  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching whiteboard',
      error: error.message
    });
  }
};

// @desc    Create whiteboard
// @route   POST /api/whiteboards/projects/:projectId
// @access  Private
const createWhiteboard = async (req, res) => {
  try {
    console.log('=== CREATE WHITEBOARD START ===');
    console.log('Create whiteboard - Request params:', req.params);
    console.log('Create whiteboard - Request body:', req.body);
    console.log('Create whiteboard - User:', req.user?._id);
    console.log('Create whiteboard - Project from RBAC middleware:', req.project?._id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Ensure canvas has proper structure
    const canvas = req.body.canvas || {};
    
    // Handle background - ensure it's an object, not a string
    let background = { color: '#ffffff' };
    if (canvas.background) {
      if (typeof canvas.background === 'string') {
        // If background is sent as string, treat it as color
        background = { color: canvas.background };
      } else if (typeof canvas.background === 'object') {
        // If background is an object, use it but ensure color exists
        background = {
          color: canvas.background.color || '#ffffff',
          image: canvas.background.image
        };
      }
    }
    
    const whiteboardData = {
      name: req.body.name || 'Project Whiteboard',
      project: req.params.projectId, // Get project from URL params
      creator: req.user._id,
      canvas: {
        objects: canvas.objects || [],
        background: background,
        settings: canvas.settings || {}
      },
      collaborators: [{
        user: req.user._id,
        isActive: true,
        cursor: { x: 0, y: 0, color: '#3b82f6' }
      }]
    };

    console.log('Creating whiteboard with data:', whiteboardData);

    const whiteboard = await Whiteboard.create(whiteboardData);
    await whiteboard.populate('creator', 'name email avatar');

    // Emit to project room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_created', {
        whiteboard,
        createdBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Whiteboard created successfully',
      data: { whiteboard }
    });
  } catch (error) {
    console.error('Create whiteboard error - Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Error creating whiteboard',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Update whiteboard
// @route   PUT /api/whiteboards/:id
// @access  Private
const updateWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const whiteboard = await Whiteboard.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'name email avatar')
     .populate('collaborators.user', 'name email avatar');

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    // Emit to project room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_updated', {
        whiteboard,
        updatedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Whiteboard updated successfully',
      data: { whiteboard }
    });
  } catch (error) {
    console.error('Update whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating whiteboard',
      error: error.message
    });
  }
};

// @desc    Add object to whiteboard
// @route   POST /api/whiteboards/:id/objects
// @access  Private
const addObject = async (req, res) => {
  try {
    const { id } = req.params;
    const objectData = {
      ...req.body,
      id: req.body.id || Date.now().toString(), // Use provided ID or generate new one
      createdBy: req.user._id,
      createdAt: new Date()
    };

    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    whiteboard.canvas.objects.push(objectData);
    await whiteboard.save();

    // Emit to project room for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_object_added', {
        whiteboardId: id,
        object: objectData,
        addedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Object added successfully',
      data: { object: objectData }
    });
  } catch (error) {
    console.error('Add object error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding object',
      error: error.message
    });
  }
};

// @desc    Update object in whiteboard
// @route   PUT /api/whiteboards/:id/objects/:objectId
// @access  Private
const updateObject = async (req, res) => {
  try {
    const { id, objectId } = req.params;
    const updates = req.body;

    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    const objectIndex = whiteboard.canvas.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Object not found'
      });
    }

    // Update object
    whiteboard.canvas.objects[objectIndex] = {
      ...whiteboard.canvas.objects[objectIndex].toObject(),
      ...updates
    };

    await whiteboard.save();

    // Emit to project room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_object_updated', {
        whiteboardId: id,
        objectId,
        updates,
        updatedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Object updated successfully',
      data: { object: whiteboard.canvas.objects[objectIndex] }
    });
  } catch (error) {
    console.error('Update object error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating object',
      error: error.message
    });
  }
};

// @desc    Delete object from whiteboard
// @route   DELETE /api/whiteboards/:id/objects/:objectId
// @access  Private
const deleteObject = async (req, res) => {
  try {
    const { id, objectId } = req.params;

    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    whiteboard.canvas.objects = whiteboard.canvas.objects.filter(obj => obj.id !== objectId);
    await whiteboard.save();

    // Emit to project room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_object_deleted', {
        whiteboardId: id,
        objectId,
        deletedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Object deleted successfully'
    });
  } catch (error) {
    console.error('Delete object error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting object',
      error: error.message
    });
  }
};

// @desc    Update collaborator cursor
// @route   PUT /api/whiteboards/:id/cursor
// @access  Private
const updateCursor = async (req, res) => {
  try {
    const { id } = req.params;
    const { x, y, color } = req.body;

    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    // Find or create collaborator
    let collaborator = whiteboard.collaborators.find(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!collaborator) {
      collaborator = {
        user: req.user._id,
        cursor: { x, y, color: color || '#3b82f6' },
        isActive: true,
        lastSeen: new Date()
      };
      whiteboard.collaborators.push(collaborator);
    } else {
      collaborator.cursor = { x, y, color: color || collaborator.cursor.color };
      collaborator.isActive = true;
      collaborator.lastSeen = new Date();
    }

    await whiteboard.save();

    // Emit cursor update to project room (except sender)
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('cursor_updated', {
        whiteboardId: id,
        userId: req.user._id,
        userName: req.user.name,
        cursor: { x, y, color }
      });
    }

    res.json({
      success: true,
      message: 'Cursor updated successfully'
    });
  } catch (error) {
    console.error('Update cursor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cursor',
      error: error.message
    });
  }
};

// @desc    Clear whiteboard (remove all objects)
// @route   DELETE /api/whiteboards/:id/objects
// @access  Private
const clearWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;

    const whiteboard = await Whiteboard.findById(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    // Clear all objects from canvas
    whiteboard.canvas.objects = [];
    await whiteboard.save();

    // Emit to project room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`project_${whiteboard.project}`).emit('whiteboard_cleared', {
        whiteboardId: id,
        clearedBy: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.json({
      success: true,
      message: 'Whiteboard cleared successfully'
    });
  } catch (error) {
    console.error('Clear whiteboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing whiteboard',
      error: error.message
    });
  }
};

module.exports = {
  getProjectWhiteboards,
  getWhiteboard,
  createWhiteboard,
  updateWhiteboard,
  addObject,
  updateObject,
  deleteObject,
  updateCursor,
  clearWhiteboard
};