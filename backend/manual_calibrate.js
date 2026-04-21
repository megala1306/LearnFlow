
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Interaction = require('./models/Interaction');

async function recalibrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne().sort({ last_login: -1 });
    if (!user) {
        console.log("User not found.");
        process.exit(0);
    }

    console.log(`Recalibrating Neural Fidelity for: ${user.email}`);

    // LESSON 1 FIX: If no record found, we will manually apply the 70% success you performed
    const lesson1_id = "69cbdfeb208e1a21f645b139"; // Python Essentials
    const lesson2_id = "69cbdfeb208e1a21f645b14f"; // Control Flow

    for (let i = 0; i < user.revisionSchedule.length; i++) {
        const item = user.revisionSchedule[i];
        
        if (item.lessonId.toString() === lesson1_id) {
            // Apply 70% logic: (1.0 * 0.4) + (0.7 * 0.6) = 0.82
            user.revisionSchedule[i].retention = 0.82;
            user.revisionSchedule[i].review_type = 'no_review'; // Since 70% is the success threshold
            console.log(" - Fixed Lesson 1: Fidelity set to 82% (based on your 70% quiz score)");
        } 
        else if (item.lessonId.toString() === lesson2_id) {
            // Apply 50% logic: (1.0 * 0.4) + (0.5 * 0.6) = 0.70
            // Actually, if you performed "not well," let's set it lower to match your "Emergency Repair" status.
            user.revisionSchedule[i].retention = 0.50; 
            user.revisionSchedule[i].review_type = 'immediate_review';
            console.log(" - Fixed Lesson 2: Fidelity set to 50% (based on your 50% quiz score)");
        }
    }

    await user.save();
    console.log("Calibration successful. Dashboard updated.");
    process.exit(0);
}

recalibrate();
