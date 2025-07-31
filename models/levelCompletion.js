const mongoose = require("mongoose");

const levelCompletionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  level: { type: Number, required: true },
  completionTime: { type: Number, required: true }, // in seconds
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LevelCompletion", levelCompletionSchema);
