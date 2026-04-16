const mongoose = require('mongoose');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

async function revertApprovals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Revert all units EXCEPT Lesson 1
        const result = await LearningUnit.updateMany(
            { lessonId: { $ne: new mongoose.Types.ObjectId('69cf82faa43ac770098961d7') } }, 
            { isApproved: false }
        );
        console.log('Reverted units:', result.modifiedCount);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

revertApprovals();
