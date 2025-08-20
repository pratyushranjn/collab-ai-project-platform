const mongoose = require("mongoose");

const WhiteboardSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    data: { type: Object, default: {} }, // store drawing JSON / canvas state
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whiteboard", WhiteboardSchema);
