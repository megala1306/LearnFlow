const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferred_learning_style: {
        type: String,
        enum: ['video', 'audio', 'read_write', 'kinesthetic'],
        default: 'read_write'
    },
    learning_speed: {
        type: String,
        enum: ['slow', 'medium', 'fast'],
        default: 'medium'
    },
    needs_diagnostic: { type: Boolean, default: true },
    xp_points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    last_login: { type: Date, default: Date.now },
    last_activity_date: { type: Date, default: null }, // Tracks last lesson completion date for streak
    level: { type: Number, default: 1 },
    retention_score: { type: Number, default: 0 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },

    // NEW: Track completed lessons per subject
    completedLessons: [
        {
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
            lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
        }
    ],

    // NEW: Revision Schedule per Learning Unit
    revisionSchedule: [
        {
            unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningUnit', required: true },
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
            lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
            last_reviewed: { type: Date, default: Date.now },
            next_review: { type: Date, required: true },
            retention: { type: Number },
            stability: { type: Number, default: 1.0 },
            review_type: { type: String, enum: ['no_review', 'light_review', 'immediate_review'] },
            complexity: { type: String, enum: ['easy', 'medium', 'hard'] },
            
            // Topic Analytics
            weakTopics: [String],
            strengths: [String],
            scoreHistory: [
                {
                    score: Number,
                    accuracy: Number,
                    timestamp: { type: Date, default: Date.now }
                }
            ]
        }
    ],
    // Progression Node
    currentLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    
    // Online Learning: Personalized Forgetting Rate (k)
    forgetting_rate: { type: Number, default: 0.1 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);