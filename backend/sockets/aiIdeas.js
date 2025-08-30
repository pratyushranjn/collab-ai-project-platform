const { generateIdeas } = require("../services/aiService");
const Idea = require("../models/Idea");

const MAX_HISTORY = 20; // ~10 message pairs

// safe wrapper 
const safe = (fn) => (...args) =>
  Promise.resolve(fn(...args)).catch((err) => {
    const socket = args[0]?.handshake ? args[0] : null;
    if (socket) socket.emit("error", err.message || "Internal error");
    console.error("[AI Ideas]", err);
  });

function registerAIIdeas(socket) {
  // AI chat with user history + clientId echo
  socket.on(
    "sendPrompt",
    safe(async ({ text, clientId, history: clientHistory }) => {
      if (!text || typeof text !== "string") {
        socket.emit("error", "Prompt text is required.");
        return;
      }

      const userId = socket.user.id;

      // save user's message
      const userMsg = await Idea.create({
        text,
        createdBy: userId,
        sender: "user",
      });

      // echo back (clientId helps front-end replace optimistic message)
      socket.emit("newMessage", { ...userMsg.toObject(), clientId });

      // build history for LLM
      let history = [];
      if (Array.isArray(clientHistory) && clientHistory.length) {
        history = clientHistory.slice(-MAX_HISTORY);
      } else {
        const recent = await Idea.find({ createdBy: userId })
          .sort({ createdAt: 1 })
          .select("sender text")
          .lean();

        history = recent.slice(-MAX_HISTORY).map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        }));
      }

      // ask the model
      const aiText = await generateIdeas(history, text);

      // save + emit AI reply
      const aiMsg = await Idea.create({
        text: aiText,
        createdBy: userId,
        sender: "AI",
      });

      socket.emit("newMessage", aiMsg);
    })
  );
}

module.exports = { registerAIIdeas };
