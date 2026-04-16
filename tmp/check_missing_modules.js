const mongoose = require('mongoose');

async function checkDatabase() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/learnflow');
        const db = mongoose.connection.db;
        
        const modules = await db.collection('modules').find().toArray();
        const learningUnits = await db.collection('learningunits').find().toArray();
        const lessons = await db.collection('lessons').find().toArray();
        
        const lessonMap = {};
        for (const l of lessons) {
            lessonMap[l._id.toString()] = l.title;
        }

        const expectedTypes = ['video', 'text', 'quiz', 'interactive'];
        
        console.log('--- MODULE INVENTORY REPORT ---\n');
        
        let totalMissing = 0;

        // Group units by lessons
        for (const lesson of lessons) {
            console.log(`\n============ LESSON: ${lesson.title} ============`);
            
            // Get learning units for this lesson
            const unitsInLesson = learningUnits.filter(lu => lu.lesson && lu.lesson.toString() === lesson._id.toString());
            
            for (const lu of unitsInLesson) {
                const luModules = modules.filter(m => m.learningUnit && m.learningUnit.toString() === lu._id.toString());
                const myTypes = luModules.map(m => m.contentType);
                const missing = expectedTypes.filter(t => !myTypes.includes(t));
                
                totalMissing += missing.length;

                console.log(`\n  Complexity: [${lu.complexity.toUpperCase()}]`);
                console.log(`  Found: ${myTypes.length > 0 ? myTypes.join(', ') : 'None (0)'}`);
                if (missing.length > 0) {
                    console.log(`  MISSING: ${missing.join(', ')}`);
                } else {
                    console.log(`  MISSING: None (All 4 modules present)`);
                }
            }
        }
        
        console.log(`\nTotal Modules in DB: ${modules.length}`);
        console.log(`Total Expected Modules: 48`);
        console.log(`Total Missing Modules: ${totalMissing}`);
        
    } catch (err) {
        console.log('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

checkDatabase();
