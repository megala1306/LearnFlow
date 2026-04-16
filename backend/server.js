require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();


// Middleware
app.use(express.json());
app.use(cors());

// ✅ Serve audio files from ../audio folder
// Use absolute path so Express knows exactly where to look
app.use('/audio', express.static(path.join(__dirname, 'audio_script', 'audio')));
// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Request Logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ✅ Root Route
app.get('/', (req, res) => {
    res.send('LearnFlow API is running');
});

// ✅ API Routes
app.use('/api/content', require('./routes/content'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/units', require('./routes/units'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/assessment', require('./routes/assessment'));

// Add this after your other API routes
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));