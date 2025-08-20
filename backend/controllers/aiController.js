const asyncWrap = require('../utils/asyncWrap');
const { generateIdeas } = require('../services/aiService');
const Idea = require('../models/Idea');

const generateIdea = asyncWrap(async (req, res) => {
    const { prompt } = req.body;

    const aiResponse = await generateIdeas(prompt);

    const userMessage = new Idea({
        text: prompt,
        createdBy: req.user.id,
    });

    const aiMessage = new Idea({
        text: aiResponse,
        sender: 'AI',        // mark as AI
    });

    await userMessage.save();
    await aiMessage.save();

    res.status(201).json({
        success: true,
        data: [userMessage, aiMessage], // returning both
    });
});

const getIdeas = asyncWrap(async (req, res) => {
    const { userId } = req.params;

    const ideas = await Idea.find({
        $or: [
            { createdBy: userId },
            { sender: 'AI' }
        ]
    }).sort({ createdAt: 1 });

    res.json({
        success: true,
        data: ideas,
    });
});

module.exports = {
    generateIdea,
    getIdeas,
};
