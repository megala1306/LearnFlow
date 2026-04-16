
const mongoose = require('mongoose');
const User = require('./models/User');
const Interaction = require('./models/Interaction');
require('dotenv').config();

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected for diagnosis...");

    const user = await User.findOne().sort({ last_login: -1 });
    if (!user) {
        console.log("No user found.");
        process.exit(0);
    }

    console.log(`User: ${user.email}`);
    console.log("--- Revision Schedule ---");
    user.revisionSchedule.forEach(rs => {
        console.log(`Lesson: ${rs.lessonId}, Retention: ${rs.retention}, UI Status: ${rs.review_type}`);
    });

    const lastInt = await Interaction.findOne({ user_id: user._id }).sort({ timestamp: -1 });
    if (lastInt) {
        console.log("--- Last Interaction ---");
        console.log(`Quiz Result: ${lastInt.quiz_result}`);
        console.log(`Saved Retention: ${lastInt.predicted_retention}`);
    }

    process.exit(0);
}

diagnose();
