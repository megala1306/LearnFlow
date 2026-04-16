
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow');
        console.log('Connected to MongoDB');
        
        const users = await User.find({}, { name: 1, email: 1, role: 1 });
        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
