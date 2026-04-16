const mongoose = require('mongoose');
const LearningUnit = require('./models/LearningUnit');
const Lesson = require('./models/Lesson');
require('dotenv').config();

async function checkUnits() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const units = await LearningUnit.find({});
        const lessons = await Lesson.find({});
        
        console.log(`Found ${lessons.length} lessons and ${units.length} units.`);
        
        const lessonMap = {};
        lessons.forEach(l => {
            lessonMap[l._id.toString()] = l.title;
        });
        
        const unitStats = {};
        units.forEach(u => {
            const lessonTitle = lessonMap[u.lessonId?.toString()] || "UNKNOWN LESSON";
            unitStats[lessonTitle] = (unitStats[lessonTitle] || 0) + 1;
        });
        
        console.log("\nUnits per Lesson:");
        console.log(JSON.stringify(unitStats, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUnits();
