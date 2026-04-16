// backend/models/LearningUnit.js
const mongoose = require('mongoose');

const learningUnitSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true }, // reference to Lesson
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' }, // optional – for module-based seeds
  complexity: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  content_text: { type: String, required: true },

  // Media & multimodal content
  video_url: { type: String },           // main video
  visual_video_url: { type: String },    // optional annotated video
  video_script: { type: String },        // transcript for video
  audio_narration: { type: String },     // optional narration
  auditory_audio_url: { type: String },  // mp3 path
  auditory_transcript: { type: String }, // full transcript text

  // Read/write notes
  readwrite_notes: [{
    heading: String,
    paragraphs: [String],
    tip: String
  }],

  // Kinesthetic / coding exercises
  kinesthetic_prompt: { type: String },
  kinesthetic_initial_code: { type: String },
  kinesthetic_expected_output: { type: String },

  // Quiz
  quiz_questions: [{
    question: String,
    options: [String],
    correct_answer: String,
    explanation: String
  }],

  // Metadata
  isApproved: { type: Boolean, default: false },
  isAssessmentApproved: { type: Boolean, default: false },
  estimated_duration: { type: Number } // in minutes
}, { timestamps: true });

module.exports = mongoose.model('LearningUnit', learningUnitSchema);