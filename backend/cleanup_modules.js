const mongoose = require('mongoose');

async function cleanOrphanedModules() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/learnflow');
        const db = mongoose.connection.db;
        
        // 1. Get all valid lesson IDs
        const lessons = await db.collection('lessons').find().toArray();
        const validLessonIds = lessons.map(l => l._id.toString());
        
        // 2. Find modules that don't belong to a valid lesson
        const modules = await db.collection('modules').find().toArray();
        const orphanedModules = modules.filter(m => !validLessonIds.includes(m.lesson_id.toString()));
        
        if (orphanedModules.length === 0) {
            console.log("No orphaned modules found. Database is already clean.");
            return;
        }

        const orphanedIds = orphanedModules.map(m => m._id);

        console.log(`Found ${orphanedModules.length} orphaned modules. Deleting...`);
        
        // 3. Delete the orphaned modules
        const deleteResult = await db.collection('modules').deleteMany({
            _id: { $in: orphanedIds }
        });

        console.log(`Successfully deleted ${deleteResult.deletedCount} orphaned modules!`);
        console.log(`Your modules collection now has exactly ${modules.length - deleteResult.deletedCount} valid modules.`);
        
    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        // Disconnect
        await mongoose.disconnect();
    }
}

cleanOrphanedModules();
