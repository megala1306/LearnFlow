const express = require('express');
const router = express.Router();
const Interaction = require('../models/Interaction');
const { auth } = require('../middleware/auth');

// @route   GET api/interactions
// @desc    Get all interactions for the current user
router.get('/', auth, async (req, res) => {
    try {
        const interactions = await Interaction.find({ user_id: req.user.id }).sort({ timestamp: -1 });
        res.json(interactions);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
