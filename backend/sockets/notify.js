function notifyUser(io, userId, payload) {
  io.to(`user:${userId}`).emit('notification:new', payload);
}

function notifyManyUsers(io, userIds, payload) {
  userIds.forEach(uid => io.to(`user:${uid}`).emit('notification:new', payload));
}

module.exports = { notifyUser, notifyManyUsers };
