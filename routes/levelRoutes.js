const express = require("express");
const router = express.Router();
const {
  generateLevel,
  completeLevel,
  getFastestPlayer,
  getAllCompletions
} = require("../controllers/levelController");

// ✅ POST /api/levels
router.post("/", generateLevel);

// ✅ POST /api/levels/complete
router.post("/complete", completeLevel);

// ✅ GET /api/leaderboard
router.get("/leaderboard", getAllCompletions);

// ✅ GET /api/levels/:levelNumber
router.get("/:levelNumber", getFastestPlayer);

module.exports = router;
