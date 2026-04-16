
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow');
        console.log('Connected to MongoDB');
        
        const email = 'admin@learnflow.com';
        const password = 'admin123';
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        
        console.log('User found:', user.email);
        console.log('Stored Hashed Password:', user.password);
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Does "admin123" match?', isMatch);
        
        process.exit(0);
    } catch (err) {
        console.error('Auth Test failed:', err);
        process.exit(1);
    }
}

testAuth();
