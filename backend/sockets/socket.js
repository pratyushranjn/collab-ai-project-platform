const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { generateIdeas } = require("../services/aiService");
const Idea = require("../models/Idea");
const Chat = require("../models/Chat");

// helper funX
const asyncHandler = (fn) => (...args) =>
  Promise.resolve(fn(...args)).catch((err) => {
    const socket = args[0]?.handshake ? args[0] : null;
    if (socket) socket.emit("error", err.message || "Internal error");
    console.error("[Socket Error]", err);
  });

// Read JWT from cookie and attach user id
function authMiddleware(socket, next) {
  try {
    const cookie = socket.handshake.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const token = match?.[1];
    if (!token) return next(new Error("Not authorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id };
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
}

// Mind Map store: { [roomId]: { nodes: [], lines: [] } }
const mindMaps = Object.create(null);

// Presence tracking 
const projectPresence = new Map();        // projectId -> Map<userId, count>
const userSockets = new Map();            // userId -> Set<socketId>


function setupSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(authMiddleware);

  const MAX_HISTORY = 20; // ~10 message pairs

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`⚡ Socket connected: user=${userId}, sid=${socket.id}`);

    // Track socket for the user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // ---- Optional: user personal room (for targeted emits) -----------------
    socket.join(`user:${userId}`);

    // ---- Backward compatibility: joinRoom by userId (from older frontend) --
    socket.on("joinRoom", ({ userId: claimedId }) => {
      if (claimedId && claimedId === userId) {
        socket.join(`user:${userId}`);
      }
    });

    // AI Chat 
    socket.on(
      "sendPrompt",
      asyncHandler(async ({ text, clientId, history: clientHistory }) => {
        if (!text || typeof text !== "string") {
          socket.emit("error", "Prompt text is required.");
          return;
        }

        // 1) Persist user's message
        const userMsg = await Idea.create({
          text,
          createdBy: userId,
          sender: "user",
        });

        // Echo back; if clientId provided, include it to replace optimistic message
        socket.emit("newMessage", { ...userMsg.toObject(), clientId });

        // 2) Build history for the model
        let history = [];
        if (Array.isArray(clientHistory) && clientHistory.length) {
          // Client can pass tail of history already mapped as [{role,text}]
          history = clientHistory.slice(-MAX_HISTORY);
        } else {
          // Load from DB, oldest->newest, tail MAX_HISTORY
          const recent = await Idea.find({ createdBy: userId })
            .sort({ createdAt: 1 })
            .select("sender text")
            .lean();

          history = recent.slice(-MAX_HISTORY).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          }));
        }

        // 3) Call the LLM
        const aiText = await generateIdeas(history, text);

        // 4) Persist and emit AI reply
        const aiMsg = await Idea.create({
          text: aiText,
          createdBy: userId,
          sender: "AI",
        });

        socket.emit("newMessage", aiMsg);
      })
    );


    // Mind Map & WhiteBoard
    socket.on(
      "joinMindMap",
      asyncHandler(async ({ roomId }) => {
        if (!roomId) {
          socket.emit("error", "roomId is required to join mind map.");
          return;
        }

        socket.join(roomId);
        if (!mindMaps[roomId]) mindMaps[roomId] = { nodes: [], lines: [] };

        // Send current state
        socket.emit("updateNodes", mindMaps[roomId].nodes);
        socket.emit("updateLines", mindMaps[roomId].lines);
      })
    );

    socket.on(
      "leaveMindMap",
      asyncHandler(async ({ roomId }) => {
        if (!roomId) return;
        socket.leave(roomId);
      })
    );

    socket.on(
      "drawing",
      asyncHandler(async (data) => {
        if (!data?.roomId) return;
        socket.to(data.roomId).emit("drawing", data);
      })
    );

    socket.on(
      "addShape",
      asyncHandler(async (data) => {
        const { roomId, shape } = data || {};
        if (!roomId || !shape) return;
        if (!mindMaps[roomId]) mindMaps[roomId] = { nodes: [], lines: [] };
        mindMaps[roomId].nodes.push(shape);
        socket.to(roomId).emit("addShape", shape);
      })
    );

    socket.on(
      "moveNode",
      asyncHandler(async (data) => {
        const { roomId, id, x, y } = data || {};
        if (!roomId || id == null) return;
        const mm = mindMaps[roomId];
        if (mm) {
          const n = mm.nodes.find((n) => n.id === id);
          if (n) {
            n.x = x;
            n.y = y;
          }
        }
        socket.to(roomId).emit("moveNode", data);
      })
    );

    socket.on(
      "editNodeText",
      asyncHandler(async (data) => {
        const { roomId, id, text } = data || {};
        if (!roomId || id == null) return;
        const mm = mindMaps[roomId];
        if (mm) {
          const n = mm.nodes.find((n) => n.id === id);
          if (n) n.text = text;
        }
        socket.to(roomId).emit("editNodeText", data);
      })
    );


    socket.on("disconnect", () => {
      // Remove from user socket set
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }

      console.log(`🔌Socket disconnected: user=${userId}, sid=${socket.id}`);
    });
  });

  return io;
}

module.exports = setupSocket;
