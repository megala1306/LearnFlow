
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow');
        console.log('Connected to MongoDB');
        
        const email = 'admin@learnflow.com';
        const password = 'admin123';
        
        // Check if exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User exists, resetting password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Password reset to: admin123');
        } else {
            console.log('Creating new admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({
                name: 'Admin User',
                email: email,
                password: hashedPassword,
                role: 'admin',
                needs_diagnostic: false
            });
            await user.save();
            console.log('Admin created with password: admin123');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createSuperAdmin();
