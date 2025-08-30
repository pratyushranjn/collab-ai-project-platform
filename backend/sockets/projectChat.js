const Chat = require("../models/Chat");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { canAccessProject } = require("../utils/canAccessProject");
const { notifyManyUsers } = require("./notify");

// presence: projectId -> Map<userId, count>
const presence = new Map();
const room = (projectId) => `project:${projectId}`;

const safe = (fn) => (...args) =>
  Promise.resolve(fn(...args)).catch((err) => {
    const socket = args[0]?.handshake ? args[0] : null;
    if (socket) socket.emit("error", err.message || "Internal error");
    console.error("[ProjectChat]", err);
  });

function registerProjectChat(socket, io) {
  // join room + presence
  socket.on(
    "project:join",
    safe(async ({ projectId }, cb) => {
      if (!projectId) return cb?.({ ok: false, error: "projectId required" });

      const ok = await canAccessProject(socket.user, projectId);
      if (!ok) return cb?.({ ok: false, error: "Forbidden" });

      socket.join(room(projectId));

      if (!presence.has(projectId)) presence.set(projectId, new Map());
      const map = presence.get(projectId);
      map.set(socket.user.id, (map.get(socket.user.id) || 0) + 1); // ✅ increment

      io.to(room(projectId)).emit("project:presence", {
        userId: socket.user.id,
        joined: true,
      });

      cb?.({ ok: true });
    })
  );

  // leave room + presence
  socket.on(
    "project:leave",
    safe(async ({ projectId }, cb) => {
      if (!projectId) return cb?.({ ok: false, error: "projectId required" });

      socket.leave(room(projectId));

      const map = presence.get(projectId);
      if (map) {
        const left = (map.get(socket.user.id) || 1) - 1;
        if (left <= 0) map.delete(socket.user.id);
        else map.set(socket.user.id, left);

        io.to(room(projectId)).emit("project:presence", {
          userId: socket.user.id,
          joined: false,
        });
      }

      cb?.({ ok: true });
    })
  );

  // send message (root or thread reply)
  socket.on(
    "message:send",
    safe(async ({ projectId, text, parentMessage = null }, cb) => {
      const t = (text || "").trim();
      if (!projectId) return cb?.({ ok: false, error: "projectId required" });
      if (!t) return cb?.({ ok: false, error: "Empty message" });

      const ok = await canAccessProject(socket.user, projectId);
      if (!ok) return cb?.({ ok: false, error: "Forbidden" });

      if (parentMessage && !/^[0-9a-fA-F]{24}$/.test(parentMessage)) {
        return cb?.({ ok: false, error: "Invalid parentMessage" });
      }
      if (parentMessage) {
        const root = await Chat.findOne({ _id: parentMessage, project: projectId }).select("_id");
        if (!root) return cb?.({ ok: false, error: "Parent not in this project" });
      }

      // save message
      const doc = await Chat.create({
        project: projectId,
        sender: socket.user.id,
        text: t,
        parentMessage: parentMessage || null,
      });

      // live chat update to users in the room
      io.to(room(projectId)).emit("message:new", {
        _id: doc._id,
        project: projectId,
        sender: {
          _id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
        },
        text: doc.text,
        parentMessage: doc.parentMessage,
        createdAt: doc.createdAt,
      });

      // 🔔 bell notifications: PM + members + assignees (exclude sender)
      const project = await Project.findById(projectId)
        .select("name projectManager members")
        .lean();

      const assignees = await Task.find({ project: projectId }).distinct("assignedTo");

      const recipientsSet = new Set(
        [
          ...(Array.isArray(project?.members) ? project.members : []),
          project?.projectManager || null,
          ...(assignees || []),
        ]
          .filter(Boolean)
          .map(String)
      );
      recipientsSet.delete(String(socket.user.id)); // don't notify sender

      const recipients = Array.from(recipientsSet);

      const payload = {
        type: "chat.message",
        createdAt: new Date().toISOString(),
        data: {
          projectId: String(projectId),
          projectName: project?.name || "Project",
          messageId: String(doc._id),
          text: doc.text,
          sender: {
            _id: socket.user.id,
            name: socket.user.name,
            email: socket.user.email,
          },
          parentMessage: doc.parentMessage || null,
        },
      };

      if (recipients.length) {
        notifyManyUsers(io, recipients, payload);
      } else {
        // optional: log once for debugging
        console.warn("[ProjectChat] no recipients for chat notification", {
          projectId,
          sender: socket.user.id,
        });
      }

      cb?.({ ok: true });
    })
  );

  // typing indicator (root or thread)
  socket.on("typing", ({ projectId, rootId = null, isTyping }) => {
    if (!projectId) return;
    socket.to(room(projectId)).emit("typing", {
      userId: socket.user.id,
      name: socket.user.name,
      email: socket.user.email,
      rootId,
      isTyping: !!isTyping,
    });
  });

}

module.exports = { registerProjectChat };


