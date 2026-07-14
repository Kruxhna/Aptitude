const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, default: 'Mock User' },
    email: { type: String },
    
    // Per-skill ELO ratings embedded directly in user document (D-07)
    ratings: {
      verbal: { type: Number, default: 1000 },
      quantitative: { type: Number, default: 1000 },
      logical: { type: Number, default: 1000 },
      spatial: { type: Number, default: 1000 },
    },
    
    // Gamification state
    totalXp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    streakFreezeAvailable: { type: Boolean, default: true },
    lastSprintDate: { type: Date },
    
    // Adaptive metadata
    sessionsCompleted: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
