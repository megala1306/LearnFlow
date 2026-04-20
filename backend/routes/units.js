const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const LearningUnit = require('../models/LearningUnit');
const Interaction = require('../models/Interaction');
const { auth, admin } = require('../middleware/auth');

/**
 * GET /api/units/recommend/:lessonId
 * Get ML recommendations for a specific lesson
 */
router.get('/recommend/:lessonId', auth, async (req, res) => {
    console.log(`[DEBUG] Recommendation hit for lesson: ${req.params.lessonId}`);
    let user, lessonSchedule, lastInteractionForLesson, globalInteraction, currentRetention = 1.0;
    const { lessonId } = req.params;

    try {
        user = await User.findById(req.user.id);
        
        // Find existing schedule for this lesson to get real retention
        lessonSchedule = user.revisionSchedule.find(rs => 
            rs.lessonId && rs.lessonId.toString() === lessonId.toString()
        );

        lastInteractionForLesson = await Interaction.findOne({
            user_id: user.id,
            lesson_id: lessonId
        }).sort({ timestamp: -1 });

        // Check if user has ANY historical interactions
        globalInteraction = await Interaction.findOne({ user_id: user.id });
        const hasSchedule = user.revisionSchedule && user.revisionSchedule.length > 0;

        const isNewUser = !globalInteraction && !hasSchedule;
        
        if (lessonSchedule) {
            const daysSince = (Date.now() - new Date(lessonSchedule.last_reviewed)) / (1000 * 60 * 60 * 24);
            currentRetention = await getRetention(daysSince, user.forgetting_rate);
        }

        // Fix: Use currentRetention as baseline accuracy if no history exists for THIS lesson
        const lastAccuracy = lastInteractionForLesson?.quiz_result || (lessonSchedule ? lessonSchedule.retention : currentRetention);
        
        const lastPrediction = lastInteractionForLesson ? (await getRetention(0, user.forgetting_rate)) : currentRetention;
        const currentError = lastAccuracy - lastPrediction;

        // Prepare request for ML Service
        const mlRequest = {
            last_complexity: lastInteractionForLesson?.complexity || lessonSchedule?.complexity || 'easy',
            last_modality: lastInteractionForLesson?.module_type || user.preferred_learning_style || 'video',
            quiz_result: lastAccuracy,
            preferred_style: user.preferred_learning_style || 'read_write',
            preferred_complexity: user.learning_speed === 'fast' ? 'hard' : (user.learning_speed === 'slow' ? 'easy' : 'medium'),
            is_new_user: isNewUser,
            retention: currentRetention,
            error: currentError,
            k: user.forgetting_rate || 0.1
        };

        const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/recommend-next`, mlRequest);

        res.json({
            ...mlRes.data,
            lessonId,
            xai_report: mlRes.data.xai_report
        });

    } catch (err) {
        console.error('Recommendation failure:', err.message);
        // Fallback: respect user preference, show default XAI panel
        try {
            const user = await require('../models/User').findById(req.user.id);
            const userHasSchedule = user.revisionSchedule && user.revisionSchedule.length > 0;
            const isActualNewUser = !globalInteraction && !userHasSchedule;
            return res.json({
                recommended_complexity: isActualNewUser ? (user.learning_speed === 'fast' ? 'hard' : (user.learning_speed === 'slow' ? 'easy' : 'medium')) : (lastInteractionForLesson?.complexity || lessonSchedule?.complexity || 'easy'),
                recommended_modality: lastInteractionForLesson?.module_type || user?.preferred_learning_style || 'video',
                xai_report: isActualNewUser ? {
                    status: 'new',
                    label: 'Building Profile',
                    explanation: 'Your AI engine is calibrating. We are starting with your preferred learning style in the meantime.',
                    memory_status: 'Initial Mapping',
                    retention_pct: null,
                    suggested_action: 'Complete this lesson to begin adaptive calibration.',
                    next_step: 'Finish the lesson and quiz to see your first AI metrics.',
                    color: 'blue'
                } : {
                    status: 'stable',
                    label: 'Stable Memory',
                    explanation: 'You have a strong understanding of this topic based on your past performance.',
                    memory_status: 'Strong',
                    retention_pct: Math.round(currentRetention * 100),
                    suggested_action: 'Proceed to advance your knowledge or refresh if you feel rusty.',
                    next_step: 'Mastery confirmed.',
                    color: 'green'
                },
                lessonId
            });
        } catch (_) {
            return res.status(500).json({ error: 'Failed to fetch node recommendation' });
        }
    }
});

/**
 * Root GET - fetch all approved units (for testing/debugging)
 */
router.get('/', auth, async (req, res) => {
    try {
        const units = await LearningUnit.find({ isApproved: true });
        res.json(units);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * GET /api/units/module/:module_id
 * Fetch units by module (approved only)
 */
router.get('/module/:module_id', auth, async (req, res) => {
    try {
        const units = await LearningUnit.find({
            module_id: req.params.module_id,
            isApproved: true
        });
        res.json(units);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * GET /api/units/adaptive/:subject_id
 * Fetch adaptive unit for user
 */
router.get('/adaptive/:subject_id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { module_type } = req.query;
        const lastInteraction = await Interaction.findOne({ user_id: user.id }).sort({ timestamp: -1 });

        // Performance-based Complexity Scaling
        const recentInteractions = await Interaction.find({ user_id: user.id }).sort({ timestamp: -1 }).limit(5);
        const avgAccuracy = recentInteractions.length > 0
            ? recentInteractions.reduce((acc, curr) => acc + curr.quiz_result, 0) / recentInteractions.length
            : 0;

        let targetComplexity = 'easy';
        if (avgAccuracy >= 0.90) targetComplexity = 'hard';
        else if (avgAccuracy >= 0.75) targetComplexity = 'medium';

        let days = lastInteraction ? (Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60 * 24) : 0;

        // ML Service Calls with error handling
        let retention = 0;
        let action = 'no_review';
        let xai_reason = '';
        try {
            const retentionRes = await axios.post(`${process.env.ML_SERVICE_URL}/estimate-retention`, {
                days_since_last_review: days
            });
            retention = retentionRes.data.retention || 0;

            const actionRes = await axios.post(`${process.env.ML_SERVICE_URL}/select-action`, {
                retention: retention,
                days_since_last_review: days
            });
            action = actionRes.data.action || 'no_review';
            xai_reason = actionRes.data.explanation;
        } catch (mlErr) {
            console.error('ML Service error:', mlErr.message);
        }

        let recommendedUnit = null;
        let currentLesson = null;
        const lessons = await Lesson.find({ subject: req.params.subject_id }).sort({ lesson_number: 1 });

        // Manual Module Switch Logic
        if (module_type) {
            currentLesson = lastInteraction ? await Lesson.findById(lastInteraction.lesson_id) : lessons[0];
            const targetModule = await Module.findOne({ lesson_id: currentLesson._id, module_type });
            if (targetModule) {
                recommendedUnit = await LearningUnit.findOne({ module_id: targetModule._id, complexity: targetComplexity })
                    || await LearningUnit.findOne({ module_id: targetModule._id });
            }
        }

        // RL Recommendation
        if (!recommendedUnit && lastInteraction) {
            if (action === 'immediate_review') {
                recommendedUnit = await LearningUnit.findById(lastInteraction.learning_unit_id);
                currentLesson = await Lesson.findById(lastInteraction.lesson_id);
            } else if (action === 'light_review') {
                const currentUnit = await LearningUnit.findById(lastInteraction.learning_unit_id);
                recommendedUnit = await LearningUnit.findOne({ module_id: currentUnit.module_id, complexity: 'easy' });
                currentLesson = await Lesson.findById(lastInteraction.lesson_id);
            }
        }

        // Adaptive Progression
        if (!recommendedUnit) {
            if (isNewUser) {
                // NEW USER: Strictly follow preference for cold start
                currentLesson = lessons[0];
                const targetModType = user.preferred_learning_style || 'video';
                
                // Try to find the specific Module for the preferred type
                const targetModuleNode = await Module.findOne({ 
                    lesson_id: currentLesson._id, 
                    module_type: targetModType 
                });

                if (targetModuleNode) {
                    recommendedUnit = await LearningUnit.findOne({ 
                        module_id: targetModuleNode._id, 
                        complexity: 'easy' 
                    }) || await LearningUnit.findOne({ module_id: targetModuleNode._id });
                }

                // If still no unit found, just get the first easy unit for this lesson
                if (!recommendedUnit) {
                    recommendedUnit = await LearningUnit.findOne({ 
                        lessonId: currentLesson._id, 
                        complexity: 'easy' 
                    }) || await LearningUnit.findOne({ lessonId: currentLesson._id });
                }
            } else {
                // EXISTING USER: Normal Progression Flow
                const lastUnit = await LearningUnit.findById(lastInteraction.learning_unit_id);
                const lastModule = await Module.findById(lastUnit.module_id);
                currentLesson = await Lesson.findById(lastInteraction.lesson_id);

                const targetType = mlRes.data.recommended_modality || lastInteraction.module_type;
                const targetMod = await Module.findOne({ lesson_id: currentLesson._id, module_type: targetType });

                if (targetMod) {
                    recommendedUnit = await LearningUnit.findOne({ 
                        module_id: targetMod._id, 
                        complexity: mlRes.data.recommended_complexity || 'easy' 
                    }) || await LearningUnit.findOne({ module_id: targetMod._id });
                }

                // Global lesson progression if stuck
                if (!recommendedUnit) {
                    const nextLesson = lessons.find(l => l.lesson_number === currentLesson.lesson_number + 1);
                    if (nextLesson) {
                        currentLesson = nextLesson;
                        recommendedUnit = await LearningUnit.findOne({ 
                            lessonId: currentLesson._id, 
                            complexity: 'easy' 
                        }) || await LearningUnit.findOne({ lessonId: currentLesson._id });
                    }
                }
            }
        }

        // Fetch modules for frontend switcher
        const currentLessonModules = currentLesson ? await Module.find({ lesson_id: currentLesson._id }) : [];

        res.json({
            unit: recommendedUnit,
            lesson: currentLesson,
            modules: currentLessonModules,
            rl_decision: action,
            predicted_retention: retention,
            xai_reason: xai_reason,
            performance: { avgAccuracy, complexity: targetComplexity }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * POST /api/units/record
 * Record user interaction with a unit
 */
router.post('/record', auth, async (req, res) => {
    const { unit_id, accuracy, recommended_action, modality, time_spent } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const unit = await LearningUnit.findById(unit_id);
        const module = await Module.findById(unit.module_id);
        const lesson = await Lesson.findById(module.lesson_id);

        console.log(`[RECORD] User ${user.name} completed unit ${unit_id} using modality: ${modality || 'default'}`);

        const complexityRewards = { 'easy': 50, 'medium': 100, 'hard': 200 };
        const passed = accuracy >= 0.7;
        const xpGained = passed ? complexityRewards[unit.complexity] : 20;

        const lastInteraction = await Interaction.findOne({ user_id: user.id }).sort({ timestamp: -1 });
        let days = lastInteraction ? (Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60 * 24) : 0;

        let retention = 0.5;
        let rl_action = recommended_action || 'no_review';
        try {
            const retentionRes = await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/estimate-retention`, { days_since_last_review: days });
            retention = retentionRes.data.retention;
            
            const actionRes = await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/select-action`, {
                retention: retention,
                days_since_last_review: days,
                complexity: unit.complexity
            });
            rl_action = actionRes.data.action || 'no_review';
        } catch (mlErr) {
            console.warn("[ML-SYNC] Failed to fetch retention/action, using fallback:", mlErr.message);
        }

        // HEURISTIC: Adjust retention based on ACTUAL quiz performance (60% weight on accuracy)
        const adjustedRetention = (retention * 0.4) + (accuracy * 0.6);

        const interaction = new Interaction({
            user_id: user.id,
            subject_id: lesson.subject,
            lesson_id: lesson._id,
            learning_unit_id: unit._id,
            module_type: module.module_type,
            actual_modality: modality || module.module_type,
            time_spent: time_spent || {
                video: 0,
                audio: 0,
                read_write: 0,
                kinesthetic: 0
            },
            complexity: unit.complexity,
            time_since_last_review: days,
            predicted_retention: adjustedRetention,
            recommended_action: rl_action,
            rl_action: rl_action,
            quiz_result: accuracy,
            quiz_score: accuracy,
            reward: accuracy
        });
        await interaction.save();

        // Calculate reward for RL Engine
        let rl_reward = -1;
        if (accuracy >= 0.8) rl_reward = 1;
        else if (accuracy >= 0.5) rl_reward = 0.5;

        // Send feedback to ML Service to update Q-table (Timing Engine + Content Engine)
        try {
            const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            
            // 1. Update Timing Engine (forgetting curve)
            await axios.post(`${mlUrl}/update-q`, {
                retention: retention,
                days_since_last_review: days,
                complexity: unit.complexity,
                action: rl_action === 'no_review' ? 0 : (rl_action === 'light_review' ? 1 : 2),
                reward: rl_reward,
                next_retention: retention, // Approximation
                next_days: 0,
                next_complexity: unit.complexity
            }, { timeout: 30000 });

            // 2. Update Content Modality Engine (VARK preference)
            const engagement_level = accuracy >= 0.5 ? 1 : 0;
            await axios.post(`${mlUrl}/update-content-q`, {
                retention: retention,
                last_quiz_score: lastInteraction?.quiz_result || 0.7,
                last_content_type: lastInteraction?.actual_modality || 'read_write',
                engagement_level: engagement_level,
                actual_content_used: modality || module.module_type,
                reward: rl_reward,
                next_retention: adjustedRetention,
                next_quiz_score: accuracy
            }, { timeout: 30000 });

            console.log(`[ML-SYNC] Successfully synchronized both AI engines for user: ${user.name}`);
        } catch (mlErr) {
            console.error("[ML-SYNC] Failed to update RL models:", mlErr.message);
        }

        const { updateXP, updateStreak } = require('../services/gamification');
        await updateXP(user.id, xpGained);
        await updateStreak(user.id);

        // Deterministic Revision Scheduling per Learning Unit
        const existingScheduleIdx = user.revisionSchedule.findIndex(
            s => s.unit_id && s.unit_id.toString() === unit._id.toString()
        );

        let last_review_type = 'no_review';
        if (existingScheduleIdx !== -1) {
            last_review_type = user.revisionSchedule[existingScheduleIdx].review_type;
        }

        // Stability Constraint (Prevent Infinite Loops)
        if (last_review_type === 'immediate_review' && rl_action === 'immediate_review') {
            rl_action = 'light_review';
        }

        // RL Action -> Time Conversion
        const now = Date.now();
        let next_review_time = now;
        
        if (rl_action === 'immediate_review') {
            next_review_time = now + (2.4 * 60 * 60 * 1000); // +2.4 hours
        } else if (rl_action === 'light_review') {
            next_review_time = now + (24 * 60 * 60 * 1000); // +1 day
        } else {
            // no_review
            const base_days = 3 + (retention * 2);
            next_review_time = now + (base_days * 24 * 60 * 60 * 1000);
        }

        const nextReviewDate = new Date(next_review_time);

        if (existingScheduleIdx !== -1) {
            user.revisionSchedule[existingScheduleIdx].next_review = nextReviewDate;
            user.revisionSchedule[existingScheduleIdx].last_reviewed = new Date(now);
            user.revisionSchedule[existingScheduleIdx].retention = adjustedRetention;
            user.revisionSchedule[existingScheduleIdx].review_type = rl_action;
            user.revisionSchedule[existingScheduleIdx].complexity = unit.complexity;
            // Clear legacy fields if they exist
            if (user.revisionSchedule[existingScheduleIdx].nextReviewDate) {
                user.revisionSchedule[existingScheduleIdx].nextReviewDate = undefined;
            }
        } else {
            user.revisionSchedule.push({
                unit_id: unit._id,
                subjectId: lesson.subject,
                lessonId: lesson._id,
                next_review: nextReviewDate,
                last_reviewed: new Date(now),
                retention: adjustedRetention,
                review_type: rl_action,
                complexity: unit.complexity
            });
        }
        await user.save();

        res.json({
            msg: 'Progress recorded',
            xp_points: user.xp_points + xpGained,
            xp_gained: xpGained,
            retention: accuracy,
            nextReviewDate
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * POST /api/units
 * Create a new learning unit (admin only)
 */
router.post(
    '/',
    [auth, admin,
        body('module_id').notEmpty(),
        body('complexity').isIn(['easy', 'medium', 'hard']),
        body('content_text').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { module_id, complexity, content_text, media_url, quiz_questions, estimated_duration } = req.body;
        try {
            const count = await LearningUnit.countDocuments({ module_id });
            if (count >= 3) return res.status(400).json({ msg: 'Module already has 3 complexity levels' });

            const newUnit = new LearningUnit({ module_id, complexity, content_text, media_url, quiz_questions, estimated_duration });
            const unit = await newUnit.save();
            res.json(unit);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    }
);

/**
 * PUT /api/units/:id
 * Update unit (admin only)
 */
router.put('/:id', [auth, admin], async (req, res) => {
    const { complexity, content_text, media_url, quiz_questions, estimated_duration } = req.body;
    try {
        let unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });

        unit = await LearningUnit.findByIdAndUpdate(
            req.params.id,
            { $set: { complexity, content_text, media_url, quiz_questions, estimated_duration } },
            { new: true }
        );
        res.json(unit);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * DELETE /api/units/:id
 * Delete unit (admin only)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });

        await LearningUnit.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Unit removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Helper: estimate retention synchronously
async function getRetention(days, k) {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const res = await axios.post(`${mlUrl}/estimate-retention`, {
            days_since_last_review: days,
            k: k || 0.1
        }, { timeout: 30000 });
        return res.data.retention;
    } catch {
        return 1.0;
    }
}

module.exports = router;