const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const LearningUnit = require('./models/LearningUnit');
const Interaction = require('./models/Interaction');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

async function performSystemAudit() {
    try {
        console.log('🚀 INITIALIZING LEARNFLOW SYSTEM AUDIT (Phase 3 & 4)...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. SETUP TEST USER
        const testEmail = 'qa_tester_' + Date.now() + '@example.com';
        const hashedPassword = await bcrypt.hash('qa_pass_123', 10);
        const testUser = new User({
            name: 'QA System Auditor',
            email: testEmail,
            password: hashedPassword,
            role: 'student',
            retention_score: 0.5 // Start with a baseline
        });
        await testUser.save();
        console.log(`✅ Created Test Student: ${testEmail}`);

        // 2. FIND A UNIT
        const unit = await LearningUnit.findOne();
        if (!unit) throw new Error('No learning unit found in DB');
        console.log(`✅ Testing with Unit: ${unit.title || unit.id}`);

        // 3. LOGIN
        const login = await axios.post(`${API_BASE}/auth/login`, {
            email: testEmail,
            password: 'qa_pass_123'
        });
        const token = login.data.token;
        console.log('✅ Authenticated with LearnFlow API');

        // 4. SUBMIT PERFECT SCORE (To test scaling up)
        console.log('\n--- TEST 1: PERFECT ACCURACY (SCALING UP) ---');
        const perfectPayload = {
            unitId: unit._id,
            answers: unit.quiz_questions.map(q => q.correct_answer),
            questions: unit.quiz_questions,
            modality: 'read_write',
            time_spent: { read_write: 300 }
        };

        const res1 = await axios.post(`${API_BASE}/assessment/submit`, perfectPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response Accuracy:', res1.data.accuracy);
        console.log('Recommendation:', res1.data.recommendation);
        console.log('Next Difficulty:', res1.data.nextDifficulty);

        // 5. VERIFY DATABASE SYNC
        const userAfter1 = await User.findById(testUser._id);
        const schedule1 = userAfter1.revisionSchedule.find(s => s.unit_id.toString() === unit._id.toString());
        
        console.log(`\nVerification:`);
        console.log(` Retention saved in DB: ${(schedule1.retention * 100).toFixed(1)}%`);
        console.log(` Scheduled Date: ${schedule1.next_review}`);
        console.log(` Global XP: ${userAfter1.xp_points}`);

        // 6. SUBMIT POOR SCORE (To test repair logic)
        console.log('\n--- TEST 2: POOR ACCURACY (REPAIR LOGIC) ---');
        const poorPayload = {
            unitId: unit._id,
            answers: unit.quiz_questions.map(() => 'WRONG_ANSWER'),
            questions: unit.quiz_questions,
            modality: 'read_write',
            time_spent: { read_write: 60 }
        };

        const res2 = await axios.post(`${API_BASE}/assessment/submit`, poorPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response Accuracy:', res2.data.accuracy);
        console.log('Recommendation:', res2.data.recommendation);
        console.log('Next Difficulty:', res2.data.nextDifficulty);

        // 7. VERIFY FINAL DATA INTEGRITY
        const userAfter2 = await User.findById(testUser._id);
        const schedule2 = userAfter2.revisionSchedule.find(s => s.unit_id.toString() === unit._id.toString());
        
        console.log(`\nFinal Audit Results:`);
        console.log(` Final Unit Complexity: ${schedule2.complexity}`);
        console.log(` Interaction Count: ${await Interaction.countDocuments({ user_id: testUser._id })}`);
        
        if (schedule2.complexity === 'easy' || schedule2.complexity === 'medium') {
             console.log('✅ REPAIR LOGIC SUCCESS: Complexity adjusted downwards due to failure.');
        }

        // CLEANUP
        // await User.deleteOne({ _id: testUser._id });
        // await Interaction.deleteMany({ user_id: testUser._id });
        // console.log('\n✅ Cleanup complete.');

        process.exit(0);
    } catch (err) {
        console.error('❌ SYSTEM AUDIT FAILED:', err.response?.data || err.message);
        process.exit(1);
    }
}

performSystemAudit();
