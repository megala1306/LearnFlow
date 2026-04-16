const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/subjects
// @desc    Get all subjects (Public)
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/subjects
// @desc    Add subject (Admin only)
router.post('/', [auth, admin], async (req, res) => {
    const { title, description } = req.body;
    try {
        const newSubject = new Subject({ title, description });
        const subject = await newSubject.save();
        res.json(subject);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   PUT api/subjects/:id
// @desc    Update subject (Admin only)
router.put('/:id', [auth, admin], async (req, res) => {
    const { title, description } = req.body;
    try {
        let subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ msg: 'Subject not found' });

        subject = await Subject.findByIdAndUpdate(
            req.params.id,
            { $set: { title, description } },
            { new: true }
        );
        res.json(subject);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/subjects/:id
// @desc    Delete subject (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ msg: 'Subject not found' });

        await Subject.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Subject removed' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
