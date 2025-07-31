// routes/scoreRoutes.js

const express = require('express');
const router = express.Router();
const { submitScore, getLeaderboard } = require('../controllers/scoreController');

// POST score
router.post('/submit-score', submitScore);

// GET leaderboard
router.get('/leaderboard', getLeaderboard);

module.exports = router;
