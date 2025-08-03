const Project = require('../models/Project');

// Check if user has specific role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check project permissions
const checkProjectPermission = (requiredRole = 'member') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.project;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user is project owner
      if (project.owner.toString() === req.user._id.toString()) {
        req.userProjectRole = 'owner';
        return next();
      }

      // Check if user is in project team
      const teamMember = project.team.find(
        member => member.user.toString() === req.user._id.toString()
      );

      if (!teamMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project'
        });
      }

      // Check if user has required role
      const roleHierarchy = {
        'viewer': 1,
        'member': 2,
        'manager': 3,
        'owner': 4
      };

      if (roleHierarchy[teamMember.role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required role: ${requiredRole}`
        });
      }

      req.userProjectRole = teamMember.role;
      req.project = project;
      next();
    } catch (error) {
      console.error('Project permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking project permissions'
      });
    }
  };
};

// Check if user owns resource
const checkResourceOwner = (Model, resourceParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resource.creator.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own resources'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = {
  authorize,
  checkProjectPermission,
  checkResourceOwner
};