const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },

    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    path: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // ancestor chain (root-first)

    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ taskId: 1, "path.length": 1, createdAt: 1 });

module.exports = mongoose.model("Comment", CommentSchema);
