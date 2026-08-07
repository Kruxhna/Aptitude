const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  authId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  xpTotal: { type: Number, default: 0 },
  elo: {
    verbal: { type: Number, default: 1000 },
    quantitative: { type: Number, default: 1000 },
    logical: { type: Number, default: 1000 },
    spatial: { type: Number, default: 1000 },
  },
  streak: {
    current: { type: Number, default: 0 },
    freezesAvailable: { type: Number, default: 1 },
    lastCompletedUTCDate: { type: String, default: null }, // "YYYY-MM-DD"
  },
  // Onboarding state
  onboardingCompleted: { type: Boolean, default: false },
  placementCompleted: { type: Boolean, default: false },
  dailyGoal: { type: Number, enum: [10, 20, 30], default: 20 },
  dailyXPTarget: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
