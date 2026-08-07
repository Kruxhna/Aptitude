const mongoose = require('mongoose');
const { Schema } = mongoose;

const placementQuestionSchema = new Schema({
  skill: {
    type: String,
    required: true,
    enum: ['verbal', 'quantitative', 'logical', 'spatial', 'mixed'],
  },
  prompt: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  difficulty: { type: Number, default: 5 }, // Medium difficulty (1-10 scale)
  isPlacement: { type: Boolean, default: true },
});

const PlacementQuestion = mongoose.model('PlacementQuestion', placementQuestionSchema);

module.exports = PlacementQuestion;
