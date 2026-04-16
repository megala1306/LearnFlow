const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
    const { name, email, password, preferred_learning_style } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ 
            name, 
            email, 
            password, 
            preferred_learning_style,
            forgetting_rate: 0.1 // Baseline from trained model
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const userWithoutPassword = await User.findById(user._id).select('-password');

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: userWithoutPassword
            });
        });
    } catch (err) {
        console.error('[AUTH ERROR] Registration failed:', err.message);
        res.status(500).json({ msg: err.message || 'Registration failed' });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const userWithoutPassword = await User.findById(user._id).select('-password');

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: userWithoutPassword
            });
        });
    } catch (err) {
        console.error('[AUTH ERROR] Login failed:', err.message);
        res.status(500).json({ msg: err.message || 'Login failed' });
    }
});

// @route   POST api/auth/diagnostic
// @desc    Update user learning diagnostic
router.post('/diagnostic', auth, async (req, res) => {
    const { preferred_learning_style, learning_speed } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.preferred_learning_style = preferred_learning_style;
        user.learning_speed = learning_speed;
        user.needs_diagnostic = false;

        await user.save();
        res.json({
            msg: 'Diagnostic patterns synchronized',
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                needs_diagnostic: user.needs_diagnostic,
                preferred_learning_style: user.preferred_learning_style,
                learning_speed: user.learning_speed
            }
        });
    } catch (err) {
        console.error('[AUTH ERROR] Diagnostic failed:', err.message);
        res.status(500).json({ msg: err.message || 'Server error' });
    }
});

module.exports = router;
