const axios = require('axios');

const ML_SERVICE_URL = 'http://127.0.0.1:8000';

async function verifyNeuralSync() {
    console.log('--- 🧠 NEURAL SYNC LOOP VERIFICATION START ---');
    try {
        // 1. Check Forgetting Curve (t=0 -> R=1)
        console.log('[SYNC] Probing Forgetting Curve at t=0...');
        const resZero = await axios.post(`${ML_SERVICE_URL}/estimate-retention`, {
            days_since_last_review: 0,
            k: 0.1
        });
        const rZero = resZero.data.retention;
        console.log(`✅ Retention at t=0: ${rZero}`);
        if (Math.abs(rZero - 1.0) < 0.05) {
            console.log("\x1b[32m[PASS]\x1b[0m Retention Boundary Check: t=0 yields R \u2248 1.");
        } else {
            console.error("\x1b[31m[FAIL]\x1b[0m Retention Boundary Check: Expected R \u2248 1, got " + rZero);
        }

        // 2. Check Retention Decay (t=7)
        console.log('[SYNC] Probing Forgetting Curve at t=7...');
        const resSeven = await axios.post(`${ML_SERVICE_URL}/estimate-retention`, {
            days_since_last_review: 7,
            k: 0.1
        });
        const rSeven = resSeven.data.retention;
        console.log(`✅ Retention at t=7: ${rSeven}`);
        if (rSeven > 0 && rSeven < 1) {
            console.log("\x1b[32m[PASS]\x1b[0m Retention Range Check: R \u2208 (0, 1) for t > 0.");
        } else {
            console.error("\x1b[31m[FAIL]\x1b[0m Retention Range Check: Invalid R=" + rSeven);
        }

        // 3. Validate RL Truth Table (Selection Logic)
        const testCases = [
            { retention: 0.9, expected: 'no_review' },
            { retention: 0.6, expected: 'light_review' },
            { retention: 0.3, expected: 'immediate_review' }
        ];

        for (const tc of testCases) {
            console.log(`[RL] Probing Selection Logic for R=${tc.retention}...`);
            const resRL = await axios.post(`${ML_SERVICE_URL}/select-action`, {
                retention: tc.retention,
                days_since_last_review: 1.0,
                complexity: 'medium'
            });
            const actual = resRL.data.action;
            if (actual === tc.expected) {
                console.log(`\x1b[32m[PASS]\x1b[0m RL Action for R=${tc.retention}: Expected ${tc.expected}, Got ${actual}`);
            } else {
                console.error(`\x1b[31m[FAIL]\x1b[0m RL Action for R=${tc.retention}: Expected ${tc.expected}, Got ${actual}`);
            }
        }

        console.log('--- 🧠 NEURAL SYNC LOOP VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Audit failed:', err.message);
        process.exit(1);
    }
}

verifyNeuralSync();
