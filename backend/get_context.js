const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Subject = require('./models/Subject');
const Lesson = require('./models/Lesson');
const LearningUnit = require('./models/LearningUnit');

async function getContext() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const subjects = await Subject.find().limit(1);
        const lessons = await Lesson.find().limit(3);
        const units = await LearningUnit.find().limit(5);

        console.log('CONTEXT_START');
        console.log(JSON.stringify({
            subjects: subjects.map(s => ({ id: s._id, title: s.title })),
            lessons: lessons.map(l => ({ id: l._id, title: l.title, subjectId: l.subject })),
            units: units.map(u => ({ id: u._id, lessonId: u.lessonId, complexity: u.complexity }))
        }, null, 2));
        console.log('CONTEXT_END');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getContext();
