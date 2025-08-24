const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: String, enum: ["user", "AI"], required: true },

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  category: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Idea', IdeaSchema);
