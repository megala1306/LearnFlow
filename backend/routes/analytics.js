const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Interaction = require('../models/Interaction'); // Assuming this exists based on usage
const { auth, admin } = require('../middleware/auth');

// @route   GET api/analytics/student
router.get('/student', auth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Mastery by Subject
        const user = await User.findById(req.user.id);
        const Subject = mongoose.model('Subject');
        const masteryData = await Promise.all((user.completedLessons || []).map(async (cl) => {
            const subject = await Subject.findById(cl.subjectId);
            return {
                name: subject ? subject.title : 'Technical Module',
                value: cl.lessons.length
            };
        }));

        // 2. Engagement over time (Last 14 interactions)
        const recentInteractions = await Interaction.find({ user_id: req.user.id })
            .sort({ timestamp: -1 })
            .limit(14);

        // 3. Performance Accuracy Trend
        const performanceTrend = recentInteractions.map(i => ({
            date: i.timestamp,
            accuracy: i.quiz_result,
            complexity: i.complexity
        })).reverse();

        // 4. Learning Intensity (Last 30 Days Activity Map for Heatmap)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        console.log("Analytics Route => userId:", userId, "thirtyDaysAgo:", thirtyDaysAgo);

        const activityMap = await Interaction.aggregate([
            { $match: { user_id: userId, timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const totalLessons = await mongoose.model('Lesson').countDocuments();

        res.json({
            mastery: masteryData,
            trend: performanceTrend,
            totalXP: user.xp_points || 0,
            streak: user.streak || 0,
            forgetting_rate: user.forgetting_rate || 0.1,
            activity: activityMap,
            totalLessons
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/retention-curve
router.get('/retention-curve', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${mlServiceUrl}/forgetting-curve`, {
            days_since_last_review: 0,
            k: 0.5 // Default stability factor, can be dynamic later
        });

        res.json(response.data.curve);
    } catch (err) {
        console.error('ML Service Error:', err.message);
        // Fallback mock data if ML service is down
        const mockCurve = Array.from({ length: 11 }, (_, i) => ({
            day: (i * 0.7).toFixed(1),
            retention: Math.exp(-0.5 * (i * 0.7))
        }));
        res.json(mockCurve);
    }
});

// @route   GET api/analytics/admin
// @desc    Get aggregate system stats (Admin only)
router.get('/admin', [auth, admin], async (req, res) => {
    try {
        // Engagement over the last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const dailyEngagement = await Interaction.aggregate([
            { $match: { timestamp: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    total: { $sum: 1 },
                    avgStability: { $avg: "$accuracy" } // Using accuracy as a proxy for neural fidelity
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Subject Popularity
        const subjectEngagement = await Interaction.aggregate([
            { $group: { _id: "$subject_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            daily: dailyEngagement,
            subjects: subjectEngagement
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const { calculateDecayedRetention } = require('../utils/retentionUtils');

// @route   GET api/analytics/schedule
router.get('/schedule', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

        // Enrich schedule with lesson titles and predicted current retention
        const enrichedSchedule = await Promise.all(user.revisionSchedule.map(async (item) => {
            const lessonDoc = await mongoose.model('Lesson').findById(item.lessonId);
            
            // Use Centralized Utility for Synchronized Decay
            const { currentRetention, daysSinceReview } = calculateDecayedRetention(
                item.retention || 0.85,
                item.last_reviewed,
                user.forgetting_rate || 0.1,
                item.stability || 1.0
            );

            // Dynamic Urgency Override based on Real-time Decay (Strict 50/70 Research Model)
            const retentionPct = Math.round(currentRetention * 100);
            let dynamicReviewType = 'no_review';
            
            if (retentionPct < 50) {
                dynamicReviewType = 'immediate_review';
            } else if (retentionPct < 70) {
                dynamicReviewType = 'light_review';
            } else {
                dynamicReviewType = 'stable';
            }

            console.log(`[UrgencySync] Lesson: ${lessonDoc?.title}, Pct: ${retentionPct}, Type: ${dynamicReviewType}`);

            return {
                ...item.toObject(),
                lessonTitle: lessonDoc ? lessonDoc.title : 'Technical Module',
                currentRetention: currentRetention,
                daysSinceReview: daysSinceReview.toFixed(1),
                review_type: dynamicReviewType
            };
        }));

        // Sort by urgency (lowest retention first)
        enrichedSchedule.sort((a, b) => a.currentRetention - b.currentRetention);

        res.json(enrichedSchedule);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
