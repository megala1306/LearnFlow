const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    lesson_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    learning_unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningUnit', required: true },
    module_type: {
        type: String,
        enum: ['video', 'audio', 'read_write', 'kinesthetic'],
        required: true
    },
    actual_modality: {
        type: String,
        enum: ['video', 'audio', 'read_write', 'kinesthetic']
    },
    time_spent: {
        video: { type: Number, default: 0 },
        audio: { type: Number, default: 0 },
        read_write: { type: Number, default: 0 },
        kinesthetic: { type: Number, default: 0 }
    },
    complexity: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    time_since_last_review: { type: Number, required: true }, // in days
    predicted_retention: { type: Number, required: true },
    recommended_action: {
        type: String,
        enum: ['no_review', 'light_review', 'immediate_review'],
        required: true
    },
    rl_action: { type: String }, // alias for recommended_action, per spec
    quiz_score: { type: Number }, // alias for quiz_result, per spec
    quiz_result: { type: Number, required: true }, // Score 0.0 to 1.0
    reward: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Interaction', interactionSchema);
