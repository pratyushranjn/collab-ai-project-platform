const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // THREADS: null = root message in room; otherwise points to the root message _id
    parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null, index: true },
  },
  { timestamps: true }
);

// Fast pagination inside a project room
ChatSchema.index({ project: 1, createdAt: 1 });

ChatSchema.virtual('replyCount', {
  ref: 'Chat',
  localField: '_id',
  foreignField: 'parentMessage',
  count: true,
});

module.exports = mongoose.model("Chat", ChatSchema);