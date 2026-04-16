const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const faye = await User.findOne({ email: 'u6@sim.learnflow.com' });
        
        if (!faye) {
            console.log('Faye not found');
            process.exit(1);
        }

        const res = await axios.post('http://localhost:8000/get-state-vitals', {
            retention: faye.retention_score,
            time_since_review: 0,
            complexity: 'easy',
            last_quiz_score: 0.15, // Faye's low score
            last_content_type: 'read_write',
            engagement_level: 0
        });

        console.log('FAYE_VITALS_START');
        console.log(JSON.stringify(res.data, null, 2));
        console.log('FAYE_VITALS_END');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
verify();
