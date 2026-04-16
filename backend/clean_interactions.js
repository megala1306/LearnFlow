const mongoose = require('mongoose');

async function cleanInteractions() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/learnflow');
        const db = mongoose.connection.db;

        const users = await db.collection('users').find().toArray();
        const validUserIds = users.map(u => u._id.toString());

        const interactions = await db.collection('interactions').find().toArray();
        const orphaned = interactions.filter(i => {
           // check if i.user_id exists and if it's invalid
           return i.user_id && !validUserIds.includes(i.user_id.toString());
        });

        if (orphaned.length > 0) {
            const orphanedIds = orphaned.map(i => i._id);
            await db.collection('interactions').deleteMany({ _id: { $in: orphanedIds } });
            console.log(`Cleaned ${orphaned.length} orphaned interactions.`);
        } else {
            console.log('No orphaned interactions found.');
        }

        // Do the same for assessments (just in case)
        const assessments = await db.collection('assessments').find().toArray();
        const orphanedAssessments = assessments.filter(a => {
           let uid = a.user_id || a.userId || a.user;
           return uid && !validUserIds.includes(uid.toString());
        });

        if (orphanedAssessments.length > 0) {
            const orphanedAssIds = orphanedAssessments.map(a => a._id);
            await db.collection('assessments').deleteMany({ _id: { $in: orphanedAssIds } });
            console.log(`Cleaned ${orphanedAssessments.length} orphaned assessments.`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        mongoose.disconnect();
    }
}
cleanInteractions();
