const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/models/User');
const Interaction = require('./backend/models/Interaction');

async function testRecommendData() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow");
    
    // Replace with the actual user ID for 'sreya' if possible, or just search by name
    const user = await User.findOne({ email: /sreya/i });
    if (!user) {
        console.log("User sreya not found");
        process.exit(1);
    }
    
    console.log("User found:", user.email, "ID:", user._id);
    
    const globalInteraction = await Interaction.findOne({ user_id: user._id });
    console.log("Global Interaction found:", !!globalInteraction);
    if (globalInteraction) {
        console.log("Example interaction lesson:", globalInteraction.lesson_id);
    }

    const firstLessonId = "69cbdfeb208e1a21f645b139"; // Python Essentials
    const secondLessonId = "69cbdfeb208e1a21f645b14f"; // Python Syntax (example)
    
    const lastInteractionForLesson = await Interaction.findOne({
        user_id: user._id,
        lesson_id: secondLessonId
    }).sort({ timestamp: -1 });
    
    console.log("Interaction for current lesson:", !!lastInteractionForLesson);
    
    const isNewUser = !globalInteraction;
    console.log("isNewUser (Calculated):", isNewUser);

    process.exit(0);
}

testRecommendData();
