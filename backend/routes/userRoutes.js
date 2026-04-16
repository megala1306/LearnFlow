const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');
const { auth, admin } = require('../middleware/auth');
const { calculateAggregateRetention } = require('../utils/retentionUtils');

// ===============================================
// GET CURRENT USER
// GET /api/users/me
// ===============================================
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // 1. Streak integrity check — reset if >48 hours since last lesson activity
    const now = new Date();
    if (user.last_activity_date) {
      const hoursSinceActivity = (now - new Date(user.last_activity_date)) / (1000 * 60 * 60);
      if (hoursSinceActivity > 48) {
        user.streak = 0; // No activity for 2+ days — reset streak
      }
    }

    // Update last_login (does NOT affect streak — streak is lesson-based)
    user.last_login = now;

    // 2. Synchronized Neural Retention Sync
    user.retention_score = calculateAggregateRetention(user.revisionSchedule, user.forgetting_rate);

    await user.save();
    
    console.log(`[AUTH-SYNC] /me updated: Streak: ${user.streak}, Live Retention: ${user.retention_score.toFixed(2)}`);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===============================================
// ENROLL IN SUBJECT
// POST /api/users/me/enroll
// ===============================================
router.post('/me/enroll', auth, async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: "subjectId is required" });
    }

    // Guard against mock/non-ObjectId subject IDs
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ error: "This is a preview course and cannot be enrolled in." });
    }

    const user = await User.findById(req.user.id);
    const alreadyEnrolled = user.completedLessons.some(cp => cp.subjectId.toString() === subjectId);

    if (!alreadyEnrolled) {
      user.completedLessons.push({ subjectId, lessons: [] });
      await user.save();

      // ML SYNC: Initialize Intelligence State
      try {
        await axios.post(`${process.env.ML_SERVICE_URL}/initialize-state`, {
          user_id: user._id.toString(),
          subject_id: subjectId
        });
      } catch (mlErr) {
        console.error("[ML-SYNC] Failed to initialize state, but enrollment proceeded:", mlErr.message);
      }
    }

    res.json({
      message: alreadyEnrolled ? "Already enrolled" : "Enrolled successfully",
      enrolledSubjectId: subjectId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Enrollment failed" });
  }
});


// ===============================================
// COMPLETE LESSON
// POST /api/users/me/complete-lesson
// ===============================================
router.post('/me/complete-lesson', auth, async (req, res) => {

  try {

    const { lessonId, subjectId } = req.body;

    if (!lessonId || !subjectId) {
      return res.status(400).json({ error: "lessonId and subjectId are required" });
    }

    const user = await User.findById(req.user.id);

    let subjectProgress = user.completedLessons.find(cp => cp.subjectId.toString() === subjectId);

    if (!subjectProgress) {
      subjectProgress = { subjectId, lessons: [lessonId] };
      user.completedLessons.push(subjectProgress);
    } else {
      if (!subjectProgress.lessons.includes(lessonId)) {
        subjectProgress.lessons.push(lessonId);
      }
    }

    await user.save();

    res.json({
      message: "Lesson completed",
      completedLessons: user.completedLessons
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to record lesson completion"
    });

  }

});


module.exports = router;