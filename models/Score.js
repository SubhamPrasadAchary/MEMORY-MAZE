const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  level: {
    type: Number,
    default: 1, // You can update this from frontend
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Score", ScoreSchema);
