const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },

    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // can assign multiple users

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"], 
      default: "todo",
    },

    position: { type: Number, default: 0 }, // used for ordering in Kanban

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium", 
    }
  },
  { timestamps: true }
);

TaskSchema.index({ project: 1, status: 1 });

TaskSchema.virtual('assigneeCount').get(function () {
  return Array.isArray(this.assignedTo) ? this.assignedTo.length : 0;
});

module.exports = mongoose.model("Task", TaskSchema);
