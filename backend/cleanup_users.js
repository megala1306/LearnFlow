const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const User = require('./models/User');

async function cleanupUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const keepEmails = [
            'admin@learnflow.com',
            'sreya1306@gmail.com',
            'student@learnflow.com',
            'test_verification@example.com'
        ];

        const result = await User.deleteMany({ email: { $nin: keepEmails } });
        console.log(`Successfully deleted ${result.deletedCount} users.`);
        console.log("Users remaining in database:");
        
        const remaining = await User.find({}).select('name email');
        console.log(JSON.stringify(remaining, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err.message);
        process.exit(1);
    }
}

cleanupUsers();
