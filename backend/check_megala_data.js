const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');

async function checkMegala() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ name: /megala/i });
        if (!user) {
            console.log('User "megala" not found');
            process.exit(0);
        }

        console.log('USER_NAME:', user.name);
        console.log('RETENTION_SCORE:', user.retention_score);
        console.log('FORGETTING_RATE:', user.forgetting_rate);
        
        console.log('--- REVISION_SCHEDULE ---');
        user.revisionSchedule.forEach((item, index) => {
            console.log(`UNIT_${index}_ID:`, item.unit_id);
            console.log(`UNIT_${index}_STABILITY:`, item.stability || 1.0);
            console.log(`UNIT_${index}_RETENTION:`, item.retention);
            console.log(`UNIT_${index}_HISTORY:`, JSON.stringify(item.scoreHistory));
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkMegala();
