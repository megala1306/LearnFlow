const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const LearningUnit = require('./models/LearningUnit');

async function findIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne();
        if (!user) {
            console.log('No user found');
        } else {
            console.log('USER_ID:', user._id);
        }

        const unit = await LearningUnit.findOne();
        if (!unit) {
            console.log('No unit found');
        } else {
            console.log('UNIT_ID:', unit._id);
            console.log('UNIT_DATA:', JSON.stringify(unit, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findIds();
