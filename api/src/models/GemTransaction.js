const mongoose = require('mongoose');
const { Schema } = mongoose;

const TRANSACTION_REASONS = [
  'PURCHASE',
  'ACHIEVEMENT',
  'BATTLE_WIN',
  'DAILY_REWARD',
  'STREAK_BONUS',
  'ADMIN_ADJUSTMENT',
];

const gemTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  delta: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    enum: TRANSACTION_REASONS,
    required: true,
  },
  refId: {
    type: String,
    default: null,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const GemTransaction = mongoose.model('GemTransaction', gemTransactionSchema);

module.exports = GemTransaction;
module.exports.TRANSACTION_REASONS = TRANSACTION_REASONS;
