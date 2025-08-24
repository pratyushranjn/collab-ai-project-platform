const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function extractText(response) {
  return (
    response?.output?.[0]?.content?.[0]?.text ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    response?.output_text ||
    "No ideas generated."
  );
}

// history: [{ role:'user'|'model', text }], prompt: string
async function generateIdeas(history = [], prompt = "") {
  const contents = [
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: prompt }] }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents,
    generationConfig: { temperature: 0.2 },
  });

  return extractText(response);
}

async function analyzeTasks(tasks = []) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [{
      role: "user",
      parts: [{ text: `Analyze these tasks JSON:\n${JSON.stringify(tasks)}` }]
    }],
    generationConfig: { temperature: 0.2 },
  });

  return extractText(response) || "No analysis generated.";
}

module.exports = { generateIdeas, analyzeTasks };
