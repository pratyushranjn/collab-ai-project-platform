const mongoose = require("mongoose");

const IdeaSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional 
  sender: { type: String, enum: ['AI'], default: null }, // AI messages
  category: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Idea", IdeaSchema);
