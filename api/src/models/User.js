const mongoose = require('mongoose');
const { Schema } = mongoose;

const LEAGUE_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Titan'];

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
  // ── League system ──
  currentLeague: {
    type: String,
    enum: LEAGUE_TIERS,
    default: 'Bronze',
  },
  weeklyXP: { type: Number, default: 0 },
  leagueHistory: [{
    league: { type: String, enum: LEAGUE_TIERS },
    weekStart: Date,
    weekEnd: Date,
  }],
  // ── Social opt-out flags (all default false = opted IN) ──
  socialOptOut: {
    friendLeaderboard: { type: Boolean, default: false },
    battles: { type: Boolean, default: false },
    clubVisibility: { type: Boolean, default: false },
  },
  // ── Battle stats ──
  battleStats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },
  },
  // ── Club membership ──
  clubId: { type: Schema.Types.ObjectId, ref: 'Club', default: null },
  // Onboarding state
  onboardingCompleted: { type: Boolean, default: false },
  placementCompleted: { type: Boolean, default: false },
  dailyGoal: { type: Number, enum: [10, 20, 30], default: 20 },
  dailyXPTarget: { type: Number, default: 50 },
  // User preferences (synced from client)
  preferences: {
    hapticsEnabled: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    soundVolume: { type: Number, default: 70, min: 0, max: 100 },
  },
  // ── Path / DAG Progress ──
  pathProgress: [{
    nodeId: { type: String, required: true },
    state: { type: String, enum: ['COMPLETED', 'PERFECT', 'REVIEW'], default: 'COMPLETED' },
    accuracy: { type: Number, default: 1.0 },
    completedAt: { type: Date, default: Date.now },
    timesCompleted: { type: Number, default: 1 },
  }],
  // ── Mascot Cosmetics ──
  mascot: {
    activeCostume: { type: String, default: 'DEFAULT' },
    unlockedCostumes: { type: [String], default: ['DEFAULT'] },
  },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.LEAGUE_TIERS = LEAGUE_TIERS;
