const LevelCompletion = require("../models/levelCompletion");

// ✅ Generate a connected path for the maze
function generateConnectedPath(gridSize, length, obstacles) {
    const path = [];
    const visited = new Set();
    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0]
    ];

    const key = (x, y) => `${x},${y}`;

    function isValid(x, y) {
        return (
            x >= 0 && y >= 0 &&
            x < gridSize && y < gridSize &&
            !obstacles.some(o => o[0] === x && o[1] === y) &&
            !visited.has(key(x, y))
        );
    }

    function dfs(x, y) {
        if (path.length === length) return true;

        visited.add(key(x, y));
        path.push([x, y]);

        const shuffledDirs = directions.sort(() => 0.5 - Math.random());
        for (const [dx, dy] of shuffledDirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (isValid(nx, ny)) {
                if (dfs(nx, ny)) return true;
            }
        }

        // Backtrack
        visited.delete(key(x, y));
        path.pop();
        return false;
    }

    // Try to find a valid path from multiple random starts
    const attempts = 20;
    for (let i = 0; i < attempts; i++) {
        const startX = Math.floor(Math.random() * gridSize);
        const startY = Math.floor(Math.random() * gridSize);
        path.length = 0;
        visited.clear();

        if (!obstacles.some(o => o[0] === startX && o[1] === startY)) {
            if (dfs(startX, startY)) break;
        }
    }

    return path;
}

exports.generateLevel = (req, res) => {
    const levelNumber = parseInt(req.body.levelNumber);
    const customGridSize = parseInt(req.body.gridSize);

    // ✅ Fallback grid size logic
    const baseGrid = 3;
    const gridIncreaseEvery = 5;
    const maxGridSize = 11;
    const gridSize = customGridSize || Math.min(baseGrid + Math.floor(levelNumber / gridIncreaseEvery), maxGridSize);

    const maxPathLength = gridSize * gridSize - 5; // Keep a few cells free
    const sequenceLength = Math.min(8 + levelNumber * 2, maxPathLength);

    const baseTime = 15; // seconds
    const timePenalty = levelNumber * 0.3;
    const timeLimit = Math.max(baseTime - timePenalty, 5);

    // All positions
    const allPositions = [];
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            allPositions.push([row, col]);
        }
    }

    // Obstacles
    const maxObstacles = Math.min(3, Math.floor((gridSize * gridSize) / 4));
    const obstacles = shuffleArray(allPositions).slice(0, maxObstacles);

    // Generate connected maze path
    const mazePositions = generateConnectedPath(gridSize, sequenceLength, obstacles);

    return res.json({
        level: levelNumber,
        grid_size: gridSize,
        sequence_length: sequenceLength,
        time_limit: timeLimit,
        maze_positions: mazePositions,
        obstacles: obstacles,
        lifelines: 3
    });
};

// 🔧 Utility functions
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    const result = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
    }
    return result;
}

exports.completeLevel = async (req, res) => {
    const { userId, username, level, completionTime } = req.body;

    if (!userId || !username || !level || !completionTime) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    await LevelCompletion.create({
        userId,
        username,
        level,
        completionTime
    });

    return res.json({ message: "Level completion recorded successfully" });
};

exports.getFastestPlayer = async (req, res) => {
    const level = parseInt(req.params.levelNumber);

    const fastest = await LevelCompletion.find({ level })
        .sort({ completionTime: 1 })
        .limit(1);

    if (!fastest.length) {
        return res.status(404).json({ message: "No completions found" });
    }

    return res.json({
        level,
        username: fastest[0].username,
        userId: fastest[0].userId,
        completionTime: fastest[0].completionTime
    });
};

exports.getAllCompletions = async (req, res) => {
    try {
        const leaderboard = await LevelCompletion.aggregate([
            // Sort by level DESC, then completionTime ASC
            { $sort: { level: -1, completionTime: 1 } },

            // Group by userId (or "username" if userId not tracked)
            {
                $group: {
                    _id: "$userId", // or "$username"
                    username: { $first: "$username" },
                    level: { $first: "$level" },
                    completionTime: { $first: "$completionTime" }
                }
            },

            // Sort the grouped results by level DESC and then by completion time
            { $sort: { level: -1, completionTime: 1 } },

            // Limit to top 10 players
            { $limit: 10 }
        ]);

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
};
