const axios = require('axios');
require('dotenv').config();

async function getStudentToken() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'student@example.com', // Replace with a real student address after finding it
            password: 'password123'
        });
        console.log('TOKEN:', loginRes.data.token);
    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
    }
}

// I need to find the student email first.
const mongoose = require('mongoose');
const User = require('./models/User');
async function findStudent() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ role: 'student' });
    if (user) {
        console.log('STUDENT_EMAIL:', user.email);
        console.log('STUDENT_ID:', user._id);
    } else {
        console.log('No student found');
    }
    process.exit(0);
}
findStudent();
