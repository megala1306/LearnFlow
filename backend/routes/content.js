// backend/routes/content.js
const express = require('express');
const router = express.Router();
const LearningUnit = require('../models/LearningUnit');
// GET all learning content
router.get('/', async (req, res) => {
    try {
        const contents = await LearningUnit.find()
            .populate({
                path: 'module_id',
                populate: {
                    path: 'lesson_id',
                    populate: { path: 'subject_id' }
                }
            })
            .sort({ createdAt: 1 });
        res.json(contents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET all learning units for a specific module
router.get('/:moduleId', async (req, res) => {
    try {
        const { moduleId } = req.params;
        const units = await LearningUnit.find({ module_id: moduleId })
            .populate({
                path: 'module_id',
                populate: {
                    path: 'lesson_id',
                    populate: { path: 'subject_id' }
                }
            });
        if (!units || units.length === 0) 
            return res.status(404).json({ msg: 'No content found' });
        res.json(units);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST add new learning unit
router.post('/', async (req, res) => {
    try {
        const newUnit = new LearningUnit({ ...req.body });
        const savedUnit = await newUnit.save();
        res.json(savedUnit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT update a learning unit
router.put('/:id', async (req, res) => {
    try {
        const updatedUnit = await LearningUnit.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedUnit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a learning unit
router.delete('/:id', async (req, res) => {
    try {
        await LearningUnit.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Content removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;