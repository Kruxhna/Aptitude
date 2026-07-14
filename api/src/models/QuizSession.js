const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sprintType: { type: String, enum: ['quick', 'standard', 'deep'], required: true },
    
    responses: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        answer: Schema.Types.Mixed,
        correct: { type: Boolean, required: true },
        timeMs: { type: Number, required: true },
      }
    ],
    
    accuracy: { type: Number },
    totalTimeMs: { type: Number },
    xpEarned: { type: Number },
    
    // ELO snapshot after session completion (D-08)
    ratingsAfter: {
      verbal: { type: Number },
      quantitative: { type: Number },
      logical: { type: Number },
      spatial: { type: Number },
    },
    
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

quizSessionSchema.index({ userId: 1, completedAt: -1 });

const QuizSession = mongoose.model('QuizSession', quizSessionSchema);

module.exports = QuizSession;
