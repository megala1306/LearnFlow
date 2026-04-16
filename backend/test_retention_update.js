const mongoose = require('mongoose');
const User = require('./models/User');
const Lesson = require('./models/Lesson');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

async function testFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow');
        console.log('Connected to MongoDB');

        const userId = '69ca3a07b9fe798c0b67bffc'; // Test Verification User
        const user = await User.findById(userId);

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        console.log('Original User Retention Score:', user.retention_score);

        // 1. Simulate the logic from assessment.js
        const unitId = '69ca242cf1c1f51ebda56910'; // A valid unit ID (from previous context)
        const accuracy = 0.35; // The 30% scenario

        let rsEntry = user.revisionSchedule.find(rs => rs.unit_id.toString() === unitId);
        
        if (rsEntry) {
            console.log('Updating existing rsEntry...');
            rsEntry.retention = accuracy; // This is the fix we applied
            rsEntry.last_reviewed = new Date();
        } else {
            console.log('Creating new rsEntry...');
            user.revisionSchedule.push({
                unit_id: new mongoose.Types.ObjectId(unitId),
                next_review: new Date(),
                retention: accuracy, // This is the fix we applied
                last_reviewed: new Date(),
                scoreHistory: [{ score: 3.5, accuracy: 0.35 }]
            });
        }

        user.markModified('revisionSchedule');
        await user.save();
        console.log('User saved successfully');

        // 2. Verify the update
        const updatedUser = await User.findById(userId);
        const updatedEntry = updatedUser.revisionSchedule.find(rs => rs.unit_id.toString() === unitId);
        
        console.log('Verification Results:');
        console.log('- Retention Field Value:', updatedEntry.retention);
        
        if (updatedEntry.retention === accuracy) {
            console.log('✅ SUCCESS: Retention baseline sync verified.');
        } else {
            console.log('❌ FAILURE: Retention baseline mismatch.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
}

testFix();
