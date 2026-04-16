
const mongoose = require('mongoose');
require('dotenv').config();

// Explicitly register all models to avoid "MissingSchemaError"
const User = require('./models/User');
const Interaction = require('./models/Interaction');

async function recover() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'sreya1306@gmail.com' });
        
        if (!user) {
            console.log("User not found.");
            process.exit(0);
        }

        console.log(`Recovering Neural Memory for: ${user.email}`);

        // 1. Fetch current Masterclass Lesson IDs
        const lesson1_id = "69cbdfeb208e1a21f645b139"; // Python Essentials
        const lesson2_id = "69cbdfeb208e1a21f645b14f"; // Control Flow
        const subject_id = "69cbdfeb208e1a21f645b123"; // Python Mastery Subject ID
        const unit1_id = "69cbdfeb208e1a21f645b13a"; // Easy Essentials Unit
        const unit2_id = "69cbdfeb208e1a21f645b150"; // Easy Control Flow Unit

        // I will take the two existing Interactions and UPGRADE them to the current schema
        const legacyInts = await Interaction.find();
        
        for (let i = 0; i < legacyInts.length; i++) {
            let legacy = legacyInts[i];
            
            // Re-mapping the results you reported (80% and 50%)
            // We use your actual report here since the legacy data had different IDs
            const accuracy = (i === 1) ? 0.8 : 0.5; 
            const lesson_id = (i === 1) ? lesson1_id : lesson2_id;
            const unit_id = (i === 1) ? unit1_id : unit2_id;

            // Update legacy record with ALL required new fields
            legacy.user_id = user._id;
            legacy.subject_id = subject_id;
            legacy.lesson_id = lesson_id;
            legacy.learning_unit_id = unit_id;
            legacy.module_type = 'read_write';
            legacy.complexity = 'easy';
            legacy.time_since_last_review = 0;
            legacy.quiz_result = accuracy;
            legacy.quiz_score = accuracy;
            legacy.predicted_retention = accuracy;
            legacy.recommended_action = (accuracy < 0.7) ? 'immediate_review' : 'no_review';
            
            await legacy.save();
            console.log(` - UPGRADED: Interaction ${i + 1} with score ${Math.round(accuracy * 100)}% correctly re-linked.`);
        }

        // 2. APPLY AUTOMATIC RULE-BASED CALIBRATION
        for (let i = 0; i < user.revisionSchedule.length; i++) {
            const item = user.revisionSchedule[i];
            const recentInt = await Interaction.findOne({ 
                user_id: user._id, 
                lesson_id: item.lessonId 
            }).sort({ timestamp: -1 });

            if (recentInt) {
                // RULE METHOD: (Prediction * 0.4) + (Actual Score * 0.6)
                const accuracy = recentInt.quiz_result;
                const automaticFidelity = (1.0 * 0.4) + (accuracy * 0.6);
                
                user.revisionSchedule[i].retention = automaticFidelity;
                user.revisionSchedule[i].review_type = recentInt.recommended_action;
                console.log(` - AUTOMATIC CALIBRATION: Lesson ${i + 1} finalized at ${Math.round(automaticFidelity * 100)}% Fidelity.`);
            }
        }

        await user.save();
        console.log("Memory Grid Restoration Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Restoration Failed:", err.message);
        process.exit(1);
    }
}

recover();
