const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * LeagueHistory — analytics-grade record of each user's weekly league placement.
 * Written by the Sunday 00:00 UTC cron job after league recomputation.
 * The User.leagueHistory embedded array holds the same data in summarized form;
 * this collection is the source-of-truth for longitudinal analytics queries.
 */
const leagueHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  league: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Titan'],
    required: true,
  },
  weeklyXP: { type: Number, default: 0 },
  rank: { type: Number, default: null }, // position within tier that week
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  promoted: { type: Boolean, default: false },
  demoted: { type: Boolean, default: false },
});

leagueHistorySchema.index({ userId: 1, weekStart: 1 });

const LeagueHistory = mongoose.model('LeagueHistory', leagueHistorySchema);

module.exports = LeagueHistory;
