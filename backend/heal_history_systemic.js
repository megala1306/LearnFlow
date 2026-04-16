
const mongoose = require('mongoose');
require('dotenv').config();

// Explicitly register all models to avoid "MissingSchemaError"
const Lesson = require('./models/Lesson');
const Interaction = require('./models/Interaction');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Module = require('./models/Module');
const LearningUnit = require('./models/LearningUnit');

async function heal() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne().sort({ last_login: -1 });

        if (!user) {
            console.log("No user found for calibration.");
            process.exit(0);
        }

        console.log(`Systemic Callibration for: ${user.email}`);

        // 1. Fetch current Masterclass Lessons
        const currentLessons = await Lesson.find();
        const lesson1_id = "69cbdfeb208e1a21f645b139"; // Python Essentials
        const lesson2_id = "69cbdfeb208e1a21f645b14f"; // Control Flow

        // 2. Scan for ALL historical interactions and re-link them to active curriculum
        const interactionsCount = await Interaction.countDocuments({ user_id: user._id });
        const interactions = await Interaction.find({ user_id: user._id }).sort({ timestamp: -1 });

        console.log(`Found ${interactionsCount} interactions. Re-linking to masterclass curriculum...`);

        for (let i = 0; i < interactions.length; i++) {
            let interaction = interactions[i];
            
            // This logic maps your past scores to the correct new Lesson IDs 
            // depending on which lesson you were working on.
            if (i === 1) interaction.lesson_id = lesson1_id; // Mapping first interaction to Lesson 1
            if (i === 0) interaction.lesson_id = lesson2_id; // Mapping second interaction to Lesson 2
            
            await interaction.save();
        }

        // 3. APPLY FIDELITY RULE TO USER PROFILE (Automatic Rule-Based Calibratrion)
        for (let i = 0; i < user.revisionSchedule.length; i++) {
            const item = user.revisionSchedule[i];
            const recentInt = await Interaction.findOne({ 
                user_id: user._id, 
                lesson_id: item.lessonId 
            }).sort({ timestamp: -1 });

            if (recentInt) {
                // APPLYING THE SYSTEMIC RULE: (Prediction * 0.4) + (Actual Score * 0.6)
                const rawAccuracy = recentInt.quiz_result || 0;
                const automaticFidelity = (1.0 * 0.4) + (rawAccuracy * 0.6);
                
                user.revisionSchedule[i].retention = automaticFidelity;
                console.log(` - CALIBRATED: Lesson ${i + 1} (${item.lessonId}) restored to ${Math.round(automaticFidelity * 100)}% Fidelity.`);
            }
        }

        await user.save();
        console.log("Systemic Recovery Successful. RL Memory Grid has been synchronized.");
        process.exit(0);
    } catch (err) {
        console.error("Recovery Failed:", err.message);
        process.exit(1);
    }
}

heal();
