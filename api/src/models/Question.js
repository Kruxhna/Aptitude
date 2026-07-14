const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'numerical', 'spatial'], required: true },
    skill: { type: String, enum: ['verbal', 'quantitative', 'logical', 'spatial'], required: true },
    difficulty: { type: Number, default: 1000 },
    explanation: { type: String, required: true },
    active: { type: Boolean, default: true },

    // MCQ specific
    options: [{ type: String }],
    correctOptionIndex: { type: Number },

    // Numerical specific
    correctAnswer: { type: Number },
    tolerance: { type: Number, default: 0 },

    // Spatial specific
    imagePath: { type: String },
    imageOptions: [{ type: String }],
    correctImageIndex: { type: Number },

    // Stats
    timesAnswered: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active questions of a specific skill and difficulty
questionSchema.index({ skill: 1, difficulty: 1, active: 1 });

// Secondary index for type-filtered queries
questionSchema.index({ type: 1, skill: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
