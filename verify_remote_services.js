
const BACKEND_URL = 'https://learnflow-backend-79r2.onrender.com';
const ML_URL = 'https://learnflow-ml.onrender.com';

async function verify() {
    console.log('--- STARTING REMOTE SERVICE VERIFICATION (using Native Fetch) ---');

    // 1. Check Backend
    try {
        console.log(`[1/2] Checking Backend at ${BACKEND_URL}...`);
        const res = await fetch(BACKEND_URL);
        const text = await res.text();
        console.log(`✅ Backend Response: ${res.status} ${text.trim()}`);
    } catch (err) {
        console.error(`❌ Backend Check Failed: ${err.message}`);
    }

    // 2. Check ML Service
    try {
        console.log(`[2/3] Checking ML Service at ${ML_URL}...`);
        const res = await fetch(`${ML_URL}/estimate-retention`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                days_since_last_review: 5,
                k: 0.1
            })
        });
        const data = await res.json();
        console.log(`✅ ML Service (Retention) Response:`, JSON.stringify(data));
        
        console.log(`[3/3] Checking ML Vitals at ${ML_URL}/get-state-vitals...`);
        const resVitals = await fetch(`${ML_URL}/get-state-vitals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                retention: 0.9,
                time_since_review: 0,
                complexity: 'medium',
                last_quiz_score: 0.8,
                last_content_type: 'read_write',
                engagement_level: 1
            })
        });
        const dataVitals = await resVitals.json();
        console.log(`✅ ML Service (Vitals) Response:`, JSON.stringify(dataVitals).slice(0, 100) + '...');

    } catch (err) {
        console.error(`❌ ML Service Check Failed: ${err.message}`);
    }

    console.log('--- VERIFICATION COMPLETE ---');
}

verify();
