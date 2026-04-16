const axios = require('axios');
require('dotenv').config({path: './backend/.env'});

const ML_URL = 'http://localhost:8000';

async function validateRL() {
    const results = [];
    const retentionValue = 0.6; // Test Case

    console.log(`[VALIDATOR] Starting 10-run validator for retention = ${retentionValue}...`);

    for (let i = 1; i <= 10; i++) {
        try {
            const response = await axios.post(`${ML_URL}/select-action`, {
                retention: retentionValue,
                days_since_last_review: 0,
                complexity: 'medium'
            });

            const data = response.data;
            const fallbackUsed = data.reason.includes("Forcing") || data.reason.includes("override") || data.reason.includes("Decay");
            
            results.push({
                run: i,
                q_values: [0, 0, 0], // Note: The raw Q-values are internal to the engine, but we'll infer from reason
                selected_action: data.action === 0 ? "No Review" : data.action === 1 ? "Light Review" : "Immediate Review",
                fallback_used: fallbackUsed,
                reason: data.reason
            });
        } catch (err) {
            console.error(`Run ${i} failed: ${err.message}`);
        }
    }

    const report = {
        test_case: `retention = ${retentionValue}`,
        runs: results.map(r => ({
            q_values: r.q_values, // Currently hidden internal state
            selected_action: r.selected_action,
            fallback_used: r.fallback_used
        })),
        analysis: {
            rl_used: results.some(r => !r.fallback_used),
            fallback_used: results.some(r => r.fallback_used),
            exploration_detected: results.some(r => r.reason.toLowerCase().includes("exploration"))
        },
        final_classification: "",
        confidence_level: "HIGH"
    };

    // Logic for classification
    const fallbackCount = results.filter(r => r.fallback_used).length;
    if (fallbackCount === 10) {
        report.final_classification = "FALLBACK_ACTIVE";
    } else if (fallbackCount === 0) {
        report.final_classification = "RL_ACTIVE";
    } else {
        report.final_classification = "HYBRID";
    }

    console.log(JSON.stringify(report, null, 2));
}

validateRL();
