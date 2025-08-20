const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Idea = require("../models/Idea");
const { generateIdeas } = require("../services/aiService");

const asyncHandler = (fn) => (...args) =>
  fn(...args).catch((err) => {
    const socket = args[0]?.handshake ? args[0] : null;
    if (socket) socket.emit("error", err.message || "Internal error");
    console.error("Socket handler error:", err);
  });

const setupSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });


  // In-memory mind map state per room
  const mindMaps = {};

  io.use((socket, next) => {
    try {
      // Read JWT from cookies
      const cookie = socket.handshake.headers.cookie || "";
      const match = cookie.match(/token=([^;]+)/);
      const token = match?.[1];
      if (!token) return next(new Error("Not authorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 User connected: ${userId}`);

    // Join user room
    socket.on("joinRoom", ({ userId }) => socket.join(userId));

    // User sends prompt
    socket.on(
      "sendPrompt",
      asyncHandler(async ({ userId, text }) => {
        // Save user message
        const userMessage = new Idea({ text, createdBy: userId });
        await userMessage.save();
        io.to(userId).emit("newMessage", { ...userMessage.toObject(), sender: "user" });

        // Generate AI message
        const aiText = await generateIdeas(text);
        const aiMessage = new Idea({ text: aiText, sender: "AI" });
        await aiMessage.save();
        io.to(userId).emit("newMessage", aiMessage);
      })
    );

    // Mind Map
    socket.on("joinMindMap", ({ roomId }) => {
      socket.join(roomId);
      if (!mindMaps[roomId]) mindMaps[roomId] = { nodes: [], lines: [] };

      // Send current mind map state to new participant
      socket.emit("updateNodes", mindMaps[roomId].nodes);
      socket.emit("updateLines", mindMaps[roomId].lines);
    });

    // Broadcast drawing data to other users in the room
    socket.on("drawing", (data) => {
      socket.to(data.roomId).emit("drawing", data);
    });

    // Broadcast new shapes or sticky notes
    socket.on("addShape", (data) => {
      socket.to(data.roomId).emit("addShape", data);
    });


    socket.on("disconnect", () => console.log(`User disconnected: ${userId}`));
  });

  return io;
};

module.exports = setupSocket;
