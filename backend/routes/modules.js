const express = require('express');
const router = express.Router();
const Module = require('../models/Module');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/modules?lessonId=xxx  (query param form)
router.get('/', auth, async (req, res) => {
    try {
        const { lessonId } = req.query;
        const filter = lessonId ? { lesson_id: lessonId } : {};
        const modules = await Module.find(filter);
        res.json(modules);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/modules/:lesson_id
router.get('/:lesson_id', auth, async (req, res) => {
    try {
        const modules = await Module.find({ lesson_id: req.params.lesson_id });
        res.json(modules);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/modules
router.post('/', [auth, admin], async (req, res) => {
    const { lesson_id, module_type } = req.body;
    try {
        const count = await Module.countDocuments({ lesson_id });
        if (count >= 4) return res.status(400).json({ msg: 'Lesson already has 4 modules' });

        const newModule = new Module({ lesson_id, module_type });
        const module = await newModule.save();
        res.json(module);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   PUT api/modules/:id
// @desc    Update module (Admin only)
router.put('/:id', [auth, admin], async (req, res) => {
    const { module_type } = req.body;
    try {
        let module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ msg: 'Module not found' });

        module = await Module.findByIdAndUpdate(
            req.params.id,
            { $set: { module_type } },
            { new: true }
        );
        res.json(module);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/modules/:id
// @desc    Delete module (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) return res.status(404).json({ msg: 'Module not found' });

        await Module.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Module removed' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
