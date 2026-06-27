const { GoogleGenAI } = require("@google/genai");

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

async function safeGenerate(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error("AI Error:", err.message);
    return "AI is busy, try again.";
  }
}

// history: [{ role:'user'|'model', text }], prompt: string
async function generateIdeas(history = [], prompt = "") {
  const trimmedHistory = history.slice(-6);

  const contents = [
    ...trimmedHistory.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    {
      role: "user",
      parts: [
        {
          text: `Reply in MAX 2 short sentences. No explanation.\n\n${prompt}`,
        },
      ],
    },
  ];

  return safeGenerate(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 120,
      },
    });

    return extractText(response)?.trim() || "No useful response. Try again.";
  });
}

async function analyzeTasks(tasks = []) {
  return safeGenerate(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                    You are a project analytics expert.

                    Analyze this task data and give:
                    1. Productivity insight
                    2. Risk or delay insight
                    3. Team performance insight

                    ONLY 3 bullet points. No extra text.

                    Data:
                    ${JSON.stringify(tasks)}
                    `,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 120,
      },
    });

    return extractText(response)?.trim() || "No analysis generated.";
  });
}

module.exports = { generateIdeas, analyzeTasks };
