const mongoose = require('mongoose');
const { Schema } = mongoose;

const friendSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  friendId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicate friend requests in either direction
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Pre-save hook to update the updatedAt timestamp
friendSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;
