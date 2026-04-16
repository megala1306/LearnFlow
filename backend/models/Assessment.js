// backend/models/Assessment.js
const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningUnit', required: true },
  contentType: { type: String, enum: ['video', 'audio', 'read_write', 'kinesthetic'], required: true },
  questions: [
    {
      id: Number,
      question: String,
      options: [String],
      correctAnswer: String
    }
  ],
  answers: [String],
  score: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

module.exports = mongoose.model('Assessment', AssessmentSchema);