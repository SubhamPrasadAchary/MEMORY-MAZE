const Score = require('../models/Score');

// @desc Submit a new score
// @route POST /api/scores
const submitScore = async (req, res) => {
  try {
    const { playerName, timeTaken, difficulty, level } = req.body;

    if (!playerName || !timeTaken || !difficulty || !level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newScore = new Score({ playerName, timeTaken, difficulty, level });
    await newScore.save();

    res.status(201).json({ message: 'Score submitted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc Get leaderboard (top scores)
// @route GET /api/scores
const getLeaderboard = async (req, res) => {
  try {
    const scores = await Score.find()
      .sort({ timeTaken: 1 }) // Fastest times first
      .limit(10);

    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = {
  submitScore,
  getLeaderboard,
};
