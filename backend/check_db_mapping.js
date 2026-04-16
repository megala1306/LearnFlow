const mongoose = require('mongoose');
const LearningUnit = require('./models/LearningUnit');
const Lesson = require('./models/Lesson');
require('dotenv').config();

async function checkMapping() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const units = await LearningUnit.find({});
        const lessons = await Lesson.find({});
        
        console.log("Lessons found:");
        lessons.forEach(l => console.log(`- ${l.title}: ${l._id}`));
        
        console.log("\nUnits found:");
        units.forEach(u => console.log(`- Complexity: ${u.complexity}, LessonId: ${u.lessonId}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMapping();
