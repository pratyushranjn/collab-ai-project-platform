const asyncWrap = require("../utils/asyncWrap");
const { generateIdeas } = require("../services/aiService");
const Idea = require("../models/Idea");
const { getCache, setCache } = require("../services/redis.service");

const generateIdea = asyncWrap(async (req, res) => {
  const userId = req.user.id;
  const { prompt = "" } = req.body;

  if (!prompt.trim()) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const normalizedPrompt = prompt.trim().toLowerCase();

  // Load conversation history FIRST
  const recent = await Idea.find({ createdBy: userId })
    .sort({ createdAt: 1 })
    .select("sender text")
    .lean();

  const history = recent.slice(-20).map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    text: m.text,
  }));

  // Create cache key
  const cacheKey = `ai:${userId}:${normalizedPrompt}`;

  // Check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      source: "cache",
      data: cached,
    });
  }

  // Generate AI response
  const aiText = await generateIdeas(history, prompt);

  // Save to DB
  const docs = await Idea.insertMany([
    { text: prompt, createdBy: userId, sender: "user" },
    { text: aiText, createdBy: userId, sender: "AI" },
  ]);

  const responseData = docs[1];

  // Cache result
  await setCache(cacheKey, responseData, 300);

  res.json({
    success: true,
    source: "api",
    data: responseData,
  });
});


const getIdeas = asyncWrap(async (req, res) => {
  const { userId } = req.params;
  const ideas = await Idea.find({ createdBy: userId }).sort({ createdAt: 1 });
  res.json({ success: true, data: ideas });
});

module.exports = { generateIdea, getIdeas };
