const mongoose = require("mongoose");

const WhiteboardSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },

    // Global whiteboard state
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: { nodes: [], lines: [] }
    },

    // Audit log of all actions
    actions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, required: true }, // e.g. addShape, moveNode
        payload: { type: Object, default: {} }, // always at least {}
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);
