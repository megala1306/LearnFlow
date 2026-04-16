const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');

// --------------------
// GET all lessons of a subject
// Example: GET /lessons?subjectId=69ae90f46af2bfe64dc9c3b4
// --------------------
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;
    let filter = {};
    if (subjectId && subjectId !== 'undefined' && subjectId !== 'null') {
      // Guard against non-ObjectId values (e.g. mock course IDs like m1, m2, m3)
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.json([]); // Return empty array gracefully for mock courses
      }
      filter = { subject: subjectId };
    }
    const lessons = await Lesson.find(filter).sort({ lesson_number: 1 });
    const LearningUnit = require('../models/LearningUnit');
    
    // Add approved unit count to each lesson
    const lessonsWithCounts = await Promise.all(lessons.map(async (lesson) => {
      const approvedCount = await LearningUnit.countDocuments({ 
        lessonId: lesson._id, 
        isApproved: true 
      });
      return { ...lesson.toObject(), approvedUnitCount: approvedCount };
    }));

    res.json(lessonsWithCounts);
  } catch (err) {
    console.error('Error fetching lessons by subject:', err);
    res.status(500).json({ message: 'Server error fetching lessons' });
  }
});

// --------------------
// GET lesson by _id or slug
// Example: GET /lessons/69ae90f46af2bfe64dc9c3b6
// --------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let lesson;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      lesson = await Lesson.findById(id);
    } else {
      lesson = await Lesson.findOne({ slug: id });
    }

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    res.json(lesson);
  } catch (err) {
    console.error('Lesson fetch error:', err);
    res.status(500).json({ message: 'Server error fetching lesson' });
  }
});

// --------------------
// GET all units of a lesson
// Example: GET /lessons/69ae90f46af2bfe64dc9c3b6/units
// --------------------
router.get('/:id/units', async (req, res) => {
  try {
    const { id } = req.params;
    let lesson;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      lesson = await Lesson.findById(id).populate('units');
    } else {
      lesson = await Lesson.findOne({ slug: id }).populate('units');
    }

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    // Fallback: If units array is empty or not populated, query LearningUnit by lessonId
    let units = lesson.units || [];
    if (units.length === 0) {
      const LearningUnit = require('../models/LearningUnit');
      units = await LearningUnit.find({ lessonId: lesson._id, isApproved: true });
    } else {
      units = units.filter(u => u.isApproved === true);
    }

    res.json({ units });
  } catch (err) {
    console.error('Error fetching lesson units:', err);
    res.status(500).json({ message: 'Server error fetching units' });
  }
});

module.exports = router;