const asyncWrap = require("../utils/asyncWrap");
const { generateIdeas } = require("../services/aiService");
const Idea = require("../models/Idea");

const generateIdea = asyncWrap(async (req, res) => {
  const userId = req.user.id;
  const { prompt = "" } = req.body;

  // Load recent conversation for this user
  const recent = await Idea.find({ createdBy: userId })
    .sort({ createdAt: 1 })
    .select("sender text")
    .lean();

  const history = recent.slice(-20).map(m => ({
    role: m.sender === "user" ? "user" : "model",
    text: m.text,
  }));

  const aiText = await generateIdeas(history, prompt);

  // Persist both messages 
  const docs = await Idea.insertMany([
    { text: prompt, createdBy: userId, sender: "user" },
    { text: aiText, createdBy: userId, sender: "AI" },
  ]);

  res.json({ success: true, data: docs[1] });
});


const getIdeas = asyncWrap(async (req, res) => {
  const { userId } = req.params;
  const ideas = await Idea.find({ createdBy: userId }).sort({ createdAt: 1 });
  res.json({ success: true, data: ideas });
});

module.exports = { generateIdea, getIdeas };
