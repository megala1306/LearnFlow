const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Subject = require('./models/Subject');
const Lesson = require('./models/Lesson');
const Module = require('./models/Module');
const LearningUnit = require('./models/LearningUnit');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const subjects = await Subject.find();
        console.log(`Subjects found: ${subjects.length}`);
        subjects.forEach(s => console.log(` - ${s.title} (${s._id})`));

        if (subjects.length > 0) {
            const subjectId = subjects[0]._id;
            const lessons = await Lesson.find({ subject_id: subjectId });
            console.log(`Lessons for first subject: ${lessons.length}`);
            
            for (const lesson of lessons) {
                const modules = await Module.find({ lesson_id: lesson._id });
                console.log(`  Lesson: ${lesson.title} - Modules: ${modules.length}`);
                for (const mod of modules) {
                    const units = await LearningUnit.find({ module_id: mod._id });
                    const approvedUnits = units.filter(u => u.isApproved);
                    console.log(`    Module: ${mod.module_type} - Units: ${units.length} (Approved: ${approvedUnits.length})`);
                }
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkDB();
