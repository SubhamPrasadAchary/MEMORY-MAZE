const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    powerUps: [{ type: String }],
    totalLevelsCompleted: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
