
const mongoose = require('mongoose');
require('dotenv').config();

// Explicitly register all models to avoid "MissingSchemaError"
const User = require('./models/User');
const Interaction = require('./models/Interaction');

async function audit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'sreya1306@gmail.com' });
        
        if (!user) {
            console.log("CRITICAL: User 'sreya1306@gmail.com' not found in database.");
            process.exit(0);
        }

        console.log(`Neural Scan for: ${user.email} (ID: ${user._id})`);

        const allInteractions = await Interaction.find();
        console.log(`Total System-wide Interactions: ${allInteractions.length}`);

        const userInteractions = await Interaction.find({ user_id: user._id }).sort({ timestamp: -1 });
        console.log(`Direct Interactions for THIS User: ${userInteractions.length}`);

        if (userInteractions.length > 0) {
            userInteractions.forEach((i, idx) => {
                console.log(`[Interaction ${idx + 1}]`);
                console.log(`  - Lesson ID: ${i.lesson_id}`);
                console.log(`  - Result: ${i.quiz_result}`);
                console.log(`  - Date: ${i.timestamp}`);
            });
        } else if (allInteractions.length > 0) {
            console.log("Warning: User exists but has 0 linked interactions. Scanning for unlinked activity...");
            // Search for ANY interactions that might have been lost due to ID shifts
            // (e.g. from previous test accounts or older ID formats)
        }

        process.exit(0);
    } catch (err) {
        console.error("Diagnosis Failed:", err.message);
        process.exit(1);
    }
}

audit();
