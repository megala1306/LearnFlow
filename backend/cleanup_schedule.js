const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow").then(async () => {
    console.log("Cleaning up orphaned revision schedules...");
    const result = await User.updateMany(
        {},
        { $pull: { revisionSchedule: { lessonId: { $exists: false } } } }
    );
    console.log(`Cleaned up ${result.modifiedCount} user profiles.`);
    
    // Also remove ones where lessonId is null
    const result2 = await User.updateMany(
        {},
        { $pull: { revisionSchedule: { lessonId: null } } }
    );
    console.log(`Cleaned up ${result2.modifiedCount} null references.`);

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
