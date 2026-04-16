const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    lesson_number: { type: Number, required: true, min: 1, max: 4 },
    title: { type: String, required: true },
    unlock_status: { type: Boolean, default: false },
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningUnit' }],
    nextLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
