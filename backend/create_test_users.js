
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createTestUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow');
        console.log('Connected to MongoDB');
        
        // 1. Admin
        async function upsert(email, name, role, password) {
            let user = await User.findOne({ email });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            if (user) {
                user.password = hashedPassword;
                await user.save();
                console.log(`Updated ${role}: ${email}`);
            } else {
                user = new User({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    role: role,
                    needs_diagnostic: false
                });
                await user.save();
                console.log(`Created ${role}: ${email}`);
            }
        }

        await upsert('admin@learnflow.com', 'Admin User', 'admin', 'admin123');
        await upsert('student@learnflow.com', 'Student User', 'student', 'student123');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createTestUsers();
