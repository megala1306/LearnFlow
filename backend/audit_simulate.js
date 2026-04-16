const mongoose = require('mongoose');
const User = require('./models/User');
const LearningUnit = require('./models/LearningUnit');
const axios = require('axios');
require('dotenv').config();

const ML_SERVICE_URL = 'http://127.0.0.1:8000';

async function silentSyncSimulation() {
    console.log('--- 🧪 SILENT SYNC SIMULATION START ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnflow');
        console.log('✅ Connected for simulation');

        // 1. Setup Dummy
        const email = 'audit_dummy@test.com';
        await User.deleteMany({ email });
        const dummy = new User({
            name: 'Audit Dummy',
            email,
            password: 'password123',
            role: 'student',
            retention_score: 0.85
        });
        await dummy.save();
        console.log('✅ Simulation User Created');

        const unit = await LearningUnit.findOne({ quiz_questions: { $exists: true, $ne: [] } });
        if (!unit) throw new Error('No learning units with questions found.');
        
        // 2. High Score Simulation (Accuracy: 1.0)
        console.log(`[SIM] Submitting High Score (1.0) for unit ${unit._id}...`);
        const resHigh = await axios.post(`${ML_SERVICE_URL}/update-performance`, {
            userId: dummy._id,
            unitId: unit._id,
            score: 5,
            totalQuestions: 5,
            accuracy: 1.0,
            answers: []
        });
        console.log(`✅ ML High Score Response: ${JSON.stringify(resHigh.data)}`);
        
        if (resHigh.data.nextDifficulty === 'hard') {
            console.log("\x1b[32m[PASS]\x1b[0m High Performance Scaling: Next difficulty set to 'hard'.");
        } else {
            console.error("\x1b[31m[FAIL]\x1b[0m High Performance Scaling: Expected 'hard', got " + resHigh.data.nextDifficulty);
        }

        // 3. Low Score Simulation (Accuracy: 0.2)
        console.log(`[SIM] Submitting Low Score (0.2) for unit ${unit._id}...`);
        const resLow = await axios.post(`${ML_SERVICE_URL}/update-performance`, {
            userId: dummy._id,
            unitId: unit._id,
            score: 1,
            totalQuestions: 5,
            accuracy: 0.2,
            answers: []
        });
        console.log(`✅ ML Low Score Response: ${JSON.stringify(resLow.data)}`);

        if (resLow.data.nextDifficulty === 'easy' && resLow.data.recommendation === 'repeat') {
            console.log("\x1b[32m[PASS]\x1b[0m Low Performance Scaling: Next difficulty 'easy' and recommendation 'repeat'.");
        } else {
            console.error("\x1b[31m[FAIL]\x1b[0m Low Performance Scaling Error.");
        }

        // Cleanup
        await User.deleteOne({ _id: dummy._id });
        console.log('✅ Simulation Cleanup Complete');
        console.log('--- 🧪 SILENT SYNC SIMULATION COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('Simulation Failed:', err.message);
        process.exit(1);
    }
}

silentSyncSimulation();
