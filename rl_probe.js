const axios = require('axios');
const ML_URL = 'http://localhost:8000';

async function probe() {
    const runs = [];
    for (let i = 1; i <= 10; i++) {
        const res = await axios.post(`${ML_URL}/select-action`, {
            retention: 0.6,
            days_since_last_review: 0,
            complexity: 'medium'
        });
        runs.push({
            run: i,
            action: res.data.action,
            reason: res.data.reason
        });
    }
    console.log(JSON.stringify(runs, null, 2));
}
probe();
