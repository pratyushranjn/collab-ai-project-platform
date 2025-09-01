const { Server } = require("socket.io");
const User = require('../models/user');
const jwt = require("jsonwebtoken");

const { registerAIIdeas } = require("./aiIdeas");
const { registerWhiteboard } = require("./whiteboard");
const { registerProjectChat } = require("./projectChat");

const asyncHandler = (fn) => (...args) =>
  Promise.resolve(fn(...args)).catch((err) => {
    const socket = args[0]?.handshake ? args[0] : null;
    if (socket) socket.emit("error", err.message || "Internal error");
    console.error("[Socket Error]", err);
  });

// Read JWT from "token" cookie and attach user id
async function authMiddleware(socket, next) {
  try {
    const cookie = socket.handshake.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const token = match?.[1];
    if (!token) return next(new Error("Not authorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // NOTE: use the right claim key: decoded.id vs decoded._id vs decoded.userId
    const user = await User.findById(decoded.id).select('_id name email role').lean();
    if (!user) return next(new Error("User not found"));

    socket.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
}

const userSockets = new Map(); // userId -> Set<socketId>

function setupSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    methods: ["GET", "POST"],
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    registerAIIdeas(socket);
    registerWhiteboard(socket);
    registerProjectChat(socket, io);

    socket.on("disconnect", () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
      console.log(`🔌 Socket disconnected: user=${userId}, sid=${socket.id}`);
    });
  });

  return io;
}

module.exports = setupSocket;



