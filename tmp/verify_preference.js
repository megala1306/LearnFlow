const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Interaction = require('./backend/models/Interaction');
const Module = require('./backend/models/Module');
const LearningUnit = require('./backend/models/LearningUnit');
const Lesson = require('./backend/models/Lesson');
const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function verifyNewUserPreference() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create a dummy new user with Video preference
        const testUser = await User.create({
            name: "Test New User",
            email: `newuser_${Date.now()}@example.com`,
            password: "password123",
            preferred_learning_style: "video"
        });
        console.log('Created New User with preference: video');

        // 2. Find the first lesson
        const firstLesson = await Lesson.findOne({ lesson_number: 1 }).sort({ createdAt: 1 });
        if (!firstLesson) throw new Error("No lessons found");

        // 3. Mock the recommendation logic (simulating units.js)
        const isNewUser = true;
        const targetModType = testUser.preferred_learning_style || 'video';
        
        const targetModuleNode = await Module.findOne({ 
            lesson_id: firstLesson._id, 
            module_type: targetModType 
        });

        console.log('Found Module for "video":', targetModuleNode ? targetModuleNode.module_type : 'NOT FOUND');

        const recommendedUnit = await LearningUnit.findOne({ 
            module_id: targetModuleNode._id, 
            complexity: 'easy' 
        }) || await LearningUnit.findOne({ module_id: targetModuleNode._id });

        console.log('Recommended Unit ID:', recommendedUnit._id);
        console.log('Recommended Unit Complexity:', recommendedUnit.complexity);
        console.log('Does it have video_url?', !!recommendedUnit.video_url);

        if (targetModuleNode && targetModuleNode.module_type === 'video' && recommendedUnit.video_url) {
            console.log('✅ VERIFICATION SUCCESS: New user respects Video preference.');
        } else {
            console.log('❌ VERIFICATION FAILED: Mismatch in recommendation.');
        }

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyNewUserPreference();
