const mongoose = require("mongoose");

const WhiteboardSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },

    // Global whiteboard state
    data: {
      type: mongoose.Schema.Types.Mixed, // ✅ allows nested objects
      default: { nodes: [], lines: [] }
    },

    // Audit log of all actions, linked to user
    actions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, required: true }, // addShape, drawLine, moveNode, editNodeText, clearBoard
        payload: { type: Object, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);
