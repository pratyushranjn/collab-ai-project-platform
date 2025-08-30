const mongoose = require('mongoose');
const ExpressError = require('../utils/ExpressError');
const { canAccessProject } = require('../utils/canAccessProject');

const ensureProjectAccess = async (req, _res, next) => {
  const projectId =
    req.params.projectId ||
    req.params.id ||
    req.body.projectId ||
    req.query.projectId;

  if (!projectId) return next(new ExpressError(400, 'Project id is required'));
  if (!mongoose.isValidObjectId(projectId)) {
    return next(new ExpressError(400, 'Invalid project id'));
  }

  const { ok, reason } = await canAccessProject(req.user, projectId);

  if (ok) return next();

  if (reason === 'not-found') return next(new ExpressError(404, 'Project not found'));
  if (reason === 'unauth') return next(new ExpressError(401, 'Unauthorized'));
  if (reason === 'bad-id') return next(new ExpressError(400, 'Invalid project id'));

  return next(new ExpressError(403, 'Not a member of this project'));
};

module.exports = { ensureProjectAccess };
