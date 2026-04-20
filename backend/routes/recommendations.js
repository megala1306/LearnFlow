const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const LearningUnit = require('../models/LearningUnit');
const Interaction = require('../models/Interaction');

// @route   GET /api/recommendations/next?subject_id=<id>&module_type=<optional>
// @desc    Returns next adaptive learning unit based on VARK + RL + complexity
// @access  Private
router.get('/next', auth, async (req, res) => {
    try {
        const { subject_id, module_type: manualModuleType } = req.query;
        const subjectObjectId = new mongoose.Types.ObjectId(subject_id);
        if (!subject_id) return res.status(400).json({ msg: 'subject_id is required' });

        const user = await User.findById(req.user.id);
        const lessons = await Lesson.find({ subject: subjectObjectId }).sort({ lesson_number: 1 });

        // --- 1. Determine days since last review & predict retention ---
        const lastInteraction = await Interaction.findOne({
            user_id: user.id,
            subject_id
        }).sort({ timestamp: -1 });

        const daysSinceLast = lastInteraction
            ? (Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60 * 24)
            : 0;

        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

        const [retentionRes, actionRes] = await Promise.all([
            axios.post(`${mlUrl}/estimate-retention`, {
                days_since_last_review: daysSinceLast,
                k: user.forgetting_rate || 0.1
            }, { timeout: 30000 }),
            axios.post(`${mlUrl}/select-action`, {
                retention: lastInteraction ? await getRetention(daysSinceLast, user.forgetting_rate) : 1.0,
                days_since_last_review: daysSinceLast,
                complexity: lastInteraction?.complexity || 'easy',
                k: user.forgetting_rate || 0.1
            }, { timeout: 30000 })
        ]);

        const predictedRetention = retentionRes.data.retention;
        const rlAction = actionRes.data.action; // no_review | light_review | immediate_review

        // --- 2. Performance-based complexity scaling & Modality (VIA ML SERVICE) ---
        const recentInteractions = await Interaction.find({ user_id: user.id, subject_id })
            .sort({ timestamp: -1 })
            .limit(5);

        const avgAccuracy = recentInteractions.length > 0
            ? recentInteractions.reduce((sum, i) => sum + i.quiz_result, 0) / recentInteractions.length
            : 0;

        let targetComplexity = 'easy';
        let resolvedModuleType = manualModuleType || user.preferred_learning_style || 'read_write';
        let xaiReport = null;

        const isNewUser = !lastInteraction;
        const lastAccuracy = lastInteraction?.quiz_result || 0;
        const lastPrediction = lastInteraction ? (await getRetention(daysSinceLast, user.forgetting_rate)) : 1.0;
        const currentError = lastAccuracy - lastPrediction;

        try {
            const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            const mlRecommendation = await axios.post(`${mlUrl}/recommend-next`, {
                last_complexity: lastInteraction?.complexity || 'easy',
                last_modality: lastInteraction?.module_type || 'read_write',
                quiz_result: lastAccuracy,
                preferred_style: resolvedModuleType,
                is_new_user: isNewUser,
                retention: predictedRetention,
                error: currentError,
                k: user.forgetting_rate || 0.1
            }, { timeout: 30000 });

            targetComplexity = mlRecommendation.data.recommended_complexity;
            xaiReport = mlRecommendation.data.xai_report;

            if (!manualModuleType) {
                resolvedModuleType = mlRecommendation.data.recommended_modality;
            }
        } catch (err) {
            console.error("ML service /recommend-next failed, using fallback.", err.message);
        }

        // --- 4. Determine which lesson / unit to recommend ---
        let recommendedUnit = null;
        let currentLesson = null;

        if (isNewUser) {
            // NEW USER: Strictly follow preference for cold start
            currentLesson = lessons[0];
            const targetModType = user.preferred_learning_style || 'video';
            const targetModuleNode = await Module.findOne({ 
                lesson_id: currentLesson?._id, 
                module_type: targetModType 
            });

            // Map learning_speed → initial complexity (fixes cold-start disconnect)
            const speedToComplexity = { slow: 'easy', medium: 'easy', fast: 'medium' };
            const initialComplexity = speedToComplexity[user.learning_speed] || 'easy';
            targetComplexity = initialComplexity;

            if (targetModuleNode) {
                recommendedUnit = await LearningUnit.findOne({ 
                    module_id: targetModuleNode._id, 
                    complexity: initialComplexity 
                }) || await LearningUnit.findOne({ 
                    module_id: targetModuleNode._id, 
                    complexity: 'easy' 
                }) || await LearningUnit.findOne({ module_id: targetModuleNode._id });
            }

            // Fallback to matching complexity unit in first lesson
            if (!recommendedUnit && currentLesson) {
                recommendedUnit = await LearningUnit.findOne({ 
                    lessonId: currentLesson._id, 
                    complexity: initialComplexity 
                }) || await LearningUnit.findOne({ 
                    lessonId: currentLesson._id, 
                    complexity: 'easy' 
                }) || await LearningUnit.findOne({ lessonId: currentLesson._id });
            }
        } else if (rlAction === 'immediate_review' && lastInteraction) {
            recommendedUnit = await LearningUnit.findById(lastInteraction.learning_unit_id);
            currentLesson = await Lesson.findById(lastInteraction.lesson_id);
            resolvedModuleType = lastInteraction.module_type;
        } else if (rlAction === 'light_review' && lastInteraction) {
            currentLesson = await Lesson.findById(lastInteraction.lesson_id);
            resolvedModuleType = lastInteraction.module_type;
            const reviewModule = await Module.findOne({
                lesson_id: currentLesson._id,
                module_type: resolvedModuleType
            });
            if (reviewModule) {
                recommendedUnit = await LearningUnit.findOne({
                    module_id: reviewModule._id,
                    complexity: 'easy'
                });
            }
        }

        // Progression: no review needed or no prior interaction (handled by isNewUser above)
        if (!recommendedUnit && !isNewUser) {
            const lastUnit = await LearningUnit.findById(lastInteraction.learning_unit_id);
            if (lastUnit && lastUnit.module_id) {
                const lastModule = await Module.findById(lastUnit.module_id);
                currentLesson = await Lesson.findById(lastInteraction.lesson_id);

                const targetMod = await Module.findOne({ 
                    lesson_id: currentLesson._id, 
                    module_type: resolvedModuleType 
                });

                if (targetMod) {
                    recommendedUnit = await LearningUnit.findOne({
                        module_id: targetMod._id,
                        complexity: targetComplexity
                    }) || await LearningUnit.findOne({ module_id: targetMod._id });
                }

                if (!recommendedUnit) {
                    // Move to next lesson
                    const nextLesson = lessons.find(l => l.lesson_number === (currentLesson ? currentLesson.lesson_number + 1 : 1));
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

        // --- 5. Fetch all modules for the Multimodal Hub switcher ---
        const allModules = currentLesson
            ? await Module.find({ lesson_id: currentLesson._id })
            : [];

        res.json({
            unit: recommendedUnit,
            lesson: currentLesson,
            module_type: resolvedModuleType,
            complexity: targetComplexity,
            rl_action: rlAction,
            rl_decision: actionRes.data,
            predicted_retention: predictedRetention,
            modules: allModules,
            xai_report: xaiReport,
            performance: { avgAccuracy, complexity: targetComplexity }
        });

    } catch (err) {
        console.error('Recommendations error detail:', err.stack || err.message);
        res.status(500).json({ error: 'Server error', details: err.message, stack: err.stack });
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
