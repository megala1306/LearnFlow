const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'student@learnflow.com' }); // Or whatever the test user is
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('--- USER DEBUG ---');
        console.log('ID:', user._id);
        console.log('XP:', user.xp_points);
        console.log('Current Lesson:', user.currentLesson);
        console.log('Completed Lessons:', JSON.stringify(user.completedLessons, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugUser();
