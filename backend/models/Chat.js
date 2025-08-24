const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } } 
);

ChatSchema.index({ projectId: 1, sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model("Chat", ChatSchema);