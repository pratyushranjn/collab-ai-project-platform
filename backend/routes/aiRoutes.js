const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateIdea, getIdeas } = require("../controllers/aiController");

router.post("/generate-ideas/user", protect, generateIdea);
router.get("/ideas/user/:userId", protect, getIdeas);

module.exports = router;
