const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'Computer Science' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    rating: { type: Number, default: 4.9 },
    size: { type: String, enum: ['normal', 'wide', 'large'], default: 'normal' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
