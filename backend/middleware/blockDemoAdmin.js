const ExpressError = require('../utils/ExpressError');

module.exports = function blockDemoAdmin(req, res, next) {
  const email = String(req.user?.email || '').toLowerCase();

  if (email === 'demo@aicollabhub.com') {
    return next(new ExpressError(403, 'Demo admin cannot perform write actions'));
  }

  next();
};