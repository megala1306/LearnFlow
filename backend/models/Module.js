const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    lesson_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    module_type: {
        type: String,
        enum: ['video', 'audio', 'read_write', 'kinesthetic'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
