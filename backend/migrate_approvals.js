const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const LearningUnit = require('./models/LearningUnit');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Updating units with missing approval fields...');
        const result = await LearningUnit.updateMany(
            { 
                $or: [
                    { isApproved: { $exists: false } },
                    { isAssessmentApproved: { $exists: false } }
                ] 
            },
            { 
                $set: { 
                    isApproved: false, 
                    isAssessmentApproved: false 
                } 
            }
        );

        console.log(`Migration complete! Updated ${result.modifiedCount} units.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
