
const mongoose = require('mongoose');
require('dotenv').config();

// Explicitly register all models to avoid "MissingSchemaError"
const User = require('./models/User');
const Interaction = require('./models/Interaction');
const Lesson = require('./models/Lesson');

async function adopt() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'sreya1306@gmail.com' });
        
        if (!user) {
            console.log("User not found.");
            process.exit(0);
        }

        console.log(`Adopting history for: ${user.email} (ID: ${user._id})`);

        // Find ALL interactions and link them to THIS user
        const totalInt = await Interaction.countDocuments();
        const interactions = await Interaction.find();
        
        console.log(`Found ${totalInt} unlinked interactions. Moving to your profile...`);

        for (let i = 0; i < interactions.length; i++) {
            let interaction = interactions[i];
            interaction.user_id = user._id; // RE-LINKING TO YOUR CORRECT PROFILE

            // Map to current Masterclass Lessons (Topic match)
            if (i === 1) interaction.lesson_id = "69cbdfeb208e1a21f645b139"; // Python Essentials
            if (i === 0) interaction.lesson_id = "69cbdfeb208e1a21f645b14f"; // Control Flow

            await interaction.save();
            console.log(` - Re-linked Interaction ${i + 1} with score: ${interaction.quiz_result}`);
        }

        // Automatic Calibrate based on the re-linked data
        for (let i = 0; i < user.revisionSchedule.length; i++) {
            const item = user.revisionSchedule[i];
            const latest = await Interaction.findOne({ 
                user_id: user._id, 
                lesson_id: item.lessonId 
            }).sort({ timestamp: -1 });

            if (latest) {
                const acc = latest.quiz_result || 0;
                const automaticFidelity = (1.0 * 0.4) + (acc * 0.6);
                user.revisionSchedule[i].retention = automaticFidelity;
                console.log(` - SYSTEMIC UPDATE: Lesson ${i + 1} automatically calibrated to ${Math.round(automaticFidelity * 100)}% based on your quiz record.`);
            }
        }

        await user.save();
        console.log("Neural Adoption Successful.");
        process.exit(0);
    } catch (err) {
        console.error("Adoption Failed:", err.message);
        process.exit(1);
    }
}

adopt();
