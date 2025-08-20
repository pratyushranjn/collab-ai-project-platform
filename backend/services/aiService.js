const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateIdeas(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [{ role: "user", parts: [{ text: prompt }]}],
  });

  // Trying multiple possible locations for text
  const text =
    response.output?.[0]?.content?.[0]?.text ||
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    response.text ||
    "No ideas generated.";

  return text;
}

async function analyzeTasks(tasks) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [{ role: "user", parts: [{ text: `Analyze these tasks: ${JSON.stringify(tasks)}` }]}],
  });

  const text =
    response.output?.[0]?.content?.[0]?.text ||
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    response.text ||
    "No analysis generated.";

  return text;
}

module.exports = { generateIdeas, analyzeTasks };
