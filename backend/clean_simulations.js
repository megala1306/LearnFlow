const mongoose = require('mongoose');

async function removeSimulatedData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/learnflow');
        const db = mongoose.connection.db;

        // Find simulated users based on email
        const users = await db.collection('users').find({
            $or: [
                { email: { $regex: /@sim\.learnflow\.com$/ } },
                { email: { $regex: /^qa_tester/ } }
            ]
        }).toArray();

        if (users.length === 0) {
            console.log("No simulated users found. Database is clean.");
            return;
        }

        const userIds = users.map(u => u._id);
        const userEmails = users.map(u => u.email);

        console.log(`Found ${users.length} simulated users to delete:`, userEmails);

        // 1. Delete the users
        const usersDeleted = await db.collection('users').deleteMany({ _id: { $in: userIds } });
        
        // 2. Delete their interactions
        const interactionsDeleted = await db.collection('interactions').deleteMany({ userId: { $in: userIds } });

        // 3. Delete their assessments
        // Sometimes the assessment field is 'user' or 'userId' based on the schema, let's try both to be safe
        const assessmentsDeleted1 = await db.collection('assessments').deleteMany({ user: { $in: userIds } });
        const assessmentsDeleted2 = await db.collection('assessments').deleteMany({ userId: { $in: userIds } });
        const assessmentsDeletedCount = (assessmentsDeleted1.deletedCount || 0) + (assessmentsDeleted2.deletedCount || 0);

        console.log(`\nSuccessfully Cleaned Up Data!`);
        console.log(`- Deleted Users: ${usersDeleted.deletedCount}`);
        console.log(`- Deleted Interactions: ${interactionsDeleted.deletedCount}`);
        console.log(`- Deleted Assessments: ${assessmentsDeletedCount}`);

    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        mongoose.disconnect();
    }
}

removeSimulatedData();
