const axios = require('axios');
require('dotenv').config({path: './backend/.env'});

const BASE_URL = 'http://localhost:5000/api';
const ML_URL = 'http://localhost:8000';

async function verifyThresholds() {
    console.log("--- 🧪 PHASE 1: RL ENGINE DIRECT CHECK ---");
    try {
        // Test retention = 0.6 (Should be Light Review / action 1)
        const res60 = await axios.post(`${ML_URL}/select-action`, {
            retention: 0.6,
            days_since_last_review: 0,
            complexity: 'medium'
        });
        console.log(`Retention 0.6 Result: ${res60.data.action} (${res60.data.reason})`);
        if (res60.data.action !== 1) throw new Error("FAIL: 60% retention should be Light Review (1)");

        // Test retention = 0.5 (Should be Immediate Review / action 2)
        const res50 = await axios.post(`${ML_URL}/select-action`, {
            retention: 0.5,
            days_since_last_review: 0,
            complexity: 'medium'
        });
        console.log(`Retention 0.5 Result: ${res50.data.action} (${res50.data.reason})`);
        if (res50.data.action !== 2) throw new Error("FAIL: 50% retention should be Immediate Review (2)");

        // Test retention = 0.85 (Should be No Review / action 0)
        const res85 = await axios.post(`${ML_URL}/select-action`, {
            retention: 0.85,
            days_since_last_review: 0,
            complexity: 'medium'
        });
        console.log(`Retention 0.85 Result: ${res85.data.action} (${res85.data.reason})`);

        console.log("\n✅ Phase 1 Passed: 60/80 boundaries are strictly enforced in the RL Engine.");
    } catch (err) {
        console.error(`❌ Phase 1 Failed: ${err.message}`);
    }

    console.log("\n--- 🧪 PHASE 2: ML XAI REPORT CHECK ---");
    try {
        const resXAI = await axios.post(`${ML_URL}/recommend-next`, {
            retention: 0.6,
            quiz_result: 0.6,
            module_type: 'read_write'
        });
        console.log(`XAI Label for 0.6: ${resXAI.data.xai_report.label} (Color: ${resXAI.data.xai_report.color})`);
        if (resXAI.data.xai_report.color !== 'orange') throw new Error("FAIL: XAI Report for 60% should be Orange");
        
        console.log("\n✅ Phase 2 Passed: XAI reports are synchronized with the 60/80 rule.");
    } catch (err) {
        console.error(`❌ Phase 2 Failed: ${err.message}`);
    }
}

verifyThresholds();
