const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const Interaction = require('./models/Interaction');

const ML_SERVICE_URL = 'http://127.0.0.1:8000';

async function pulse() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- [NEURAL PULSE: STARTING] ---');

        const interactions = await Interaction.find().sort({ timestamp: 1 });
        console.log(`Found ${interactions.length} interactions to synchronize.`);

        for (const int of interactions) {
            console.log(`Processing Interaction for User: ${int.user_id} (Score: ${int.quiz_score}%)`);

            try {
                // 1. Timing Model Sync (Strict UpdateRequest Schema)
                const timingActionIdx = int.quiz_score >= 70 ? 0 : (int.quiz_score >= 50 ? 1 : 2);
                const timingReward = int.quiz_score >= 70 ? 1.0 : (int.quiz_score >= 50 ? 0.4 : -1.0);

                await axios.post(`${ML_SERVICE_URL}/update-q`, {
                    retention: int.predicted_retention,
                    days_since_last_review: int.time_since_last_review || 0,
                    action: timingActionIdx,
                    reward: timingReward,
                    next_retention: int.predicted_retention, 
                    next_days: 0
                });

                // 2. Content Modality Sync (Strict ContentUpdateReq Schema)
                const contentReward = int.quiz_score >= 70 ? 1.0 : (int.quiz_score >= 50 ? 0.5 : -1.0);
                await axios.post(`${ML_SERVICE_URL}/update-content-q`, {
                    retention: int.predicted_retention,
                    last_quiz_score: int.quiz_result,
                    last_modality: int.actual_modality,
                    days_since_last_review: int.time_since_last_review || 0,
                    reward: contentReward,
                    next_retention: int.predicted_retention,
                    next_days_since_last_review: 0,
                    actual_modality_used: int.actual_modality
                });

            } catch (err) {
                console.error(`Error syncing interaction: ${err.message}`);
            }
        }

        console.log('--- [NEURAL PULSE: COMPLETE] ---');
        process.exit(0);
    } catch (err) {
        console.error('Pulse failed:', err);
        process.exit(1);
    }
}

pulse();
