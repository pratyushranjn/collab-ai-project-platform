const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  method: String,
  url: String,
  status: Number,
  responseTime: Number,
  ip: String,
  userAgent: String,

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userEmail: { type: String, default: null },
  role: { type: String, default: null },

  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
