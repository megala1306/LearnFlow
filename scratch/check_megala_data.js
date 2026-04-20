const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkMegala() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ name: /megala/i });
        if (!user) {
            console.log('User "megala" not found');
            process.exit(0);
        }

        console.log('User Found:', user.name);
        console.log('Email:', user.email);
        console.log('Global Retention Score:', user.retention_score);
        console.log('Forgetting Rate (k):', user.forgetting_rate);
        
        console.log('\n--- Revision Schedule & Stability ---');
        user.revisionSchedule.forEach((item, index) => {
            console.log(`\nUnit Index: ${index}`);
            console.log(`Unit ID: ${item.unit_id}`);
            console.log(`Last Reviewed: ${item.last_reviewed}`);
            console.log(`Current Stability: ${item.stability || 1.0} (Default: 1.0)`);
            console.log(`Current Retention: ${item.retention}`);
            console.log(`Score History:`, JSON.stringify(item.scoreHistory, null, 2));
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkMegala();
