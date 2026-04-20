const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').auth;
const admin = require('../middleware/auth').admin;
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const LearningUnit = require('../models/LearningUnit');

// ─── CONTENT MANAGEMENT ────────────────────────────────────────────────────────

// @route   GET api/admin/all-content
// @desc    Get ALL learning units (approved + pending), optional ?status=pending|approved
// @access  Private/Admin
router.get('/all-content', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const filter = {};
        if (req.query.status === 'pending') {
            filter.$or = [{ isApproved: { $ne: true } }, { isAssessmentApproved: { $ne: true } }];
        } else if (req.query.status === 'approved') {
            filter.isApproved = true;
            filter.isAssessmentApproved = true;
        }

        const units = await LearningUnit.find(filter)
            .populate('lessonId') // Direct population
            .populate({
                path: 'module_id',
                populate: {
                    path: 'lesson_id',
                    populate: { path: 'subject' } // Fixed field name
                }
            })
            .sort({ createdAt: -1 });

        res.json(units);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/pending-content
// @desc    Get all units where isApproved is false OR isAssessmentApproved is false
// @access  Private/Admin
router.get('/pending-content', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const pending = await LearningUnit.find({ 
            $or: [
                { isApproved: { $ne: true } },
                { isAssessmentApproved: { $ne: true } }
            ]
        })
            .populate('lessonId') // Added for robustness
            .populate({
                path: 'module_id',
                populate: {
                    path: 'lesson_id',
                    populate: { path: 'subject' } // Fixed field name
                }
            })
            .sort({ createdAt: -1 });
        res.json(pending);
    } catch (err) {
        console.error('[ADMIN] pending-content error:', err.message);
        res.status(500).json({ msg: err.message });
    }
});

// @route   POST api/admin/approve-content/:id    (legacy – kept for backwards compat)
// @desc    Approve a specific learning unit
// @access  Private/Admin
router.post('/approve-content/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
        const unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });
        unit.isApproved = true;
        await unit.save();
        res.json({ msg: 'Content approved', unit });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/admin/approve-content/:id
// @desc    Toggle approval state of a learning unit  { approved: true|false, assessmentApproved: true|false }
// @access  Private/Admin
router.patch('/approve-content/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });

        if (req.body.approved !== undefined) unit.isApproved = req.body.approved;
        if (req.body.assessmentApproved !== undefined) unit.isAssessmentApproved = req.body.assessmentApproved;
        
        await unit.save();

        res.json({ msg: `Content updated`, unit });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/content/:id
// @desc    Update content fields of a learning unit (admin editor)
// @access  Private/Admin
router.put('/content/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });

        const allowed = [
            'complexity', 'content_text', 'media_url', 'video_script',
            'audio_narration', 'readwrite_notes', 'kinesthetic_prompt',
            'kinesthetic_initial_code', 'kinesthetic_expected_output',
            'quiz_questions', 'estimated_duration', 'isApproved', 'isAssessmentApproved'
        ];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) unit[field] = req.body[field];
        });
        await unit.save();
        res.json(unit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/content/:id
// @desc    Delete a learning unit
// @access  Private/Admin
router.delete('/content/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
        const unit = await LearningUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ msg: 'Unit not found' });
        await LearningUnit.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Unit deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/create-unit
// @desc    Manually create a learning unit (starts as pending)
// @access  Private/Admin
router.post('/create-unit', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const { module_id, complexity, content_text, media_url, quiz_questions, estimated_duration } = req.body;
        if (!module_id || !complexity || !content_text) {
            return res.status(400).json({ msg: 'module_id, complexity, and content_text are required' });
        }

        const count = await LearningUnit.countDocuments({ module_id });
        if (count >= 3) return res.status(400).json({ msg: 'Module already has 3 complexity levels' });

        const unit = new LearningUnit({
            module_id, complexity, content_text, media_url,
            quiz_questions: quiz_questions || [],
            estimated_duration: estimated_duration || 5,
            isApproved: false   // always starts as pending
        });
        await unit.save();
        res.json(unit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ─── SYSTEM HEALTH & STATS ──────────────────────────────────────────────────────

const checkMLService = async () => {
    try {
        const response = await axios.get(process.env.ML_SERVICE_URL, { timeout: 2000 });
        return response.status === 200 ? 'online' : 'offline';
    } catch (err) {
        return 'offline';
    }
};

// @route   GET api/admin/health
router.get('/health', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
        const mlStatus = await checkMLService();
        const dbStatus = mongoose.connection.readyState === 1 ? 'online' : 'offline';
        res.json({
            services: { backend: 'online', database: dbStatus, ml_service: mlStatus },
            timestamp: new Date()
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/stats
router.get('/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        const userCount = await User.countDocuments({ role: 'student' });
        const subjectCount = await Subject.countDocuments();
        const pendingCount = await LearningUnit.countDocuments({ 
            $or: [{ isApproved: { $ne: true } }, { isAssessmentApproved: { $ne: true } }] 
        });
        const approvedCount = await LearningUnit.countDocuments({ isApproved: true, isAssessmentApproved: true });

        const students = await User.find({ role: 'student' });
        const avgRetention = students.length > 0
            ? students.reduce((acc, curr) => acc + (curr.retention_score || 0), 0) / students.length
            : 0;

        res.json({
            total_students: userCount,
            total_subjects: subjectCount,
            pending_content: pendingCount,
            approved_content: approvedCount,
            average_fidelity: (avgRetention * 100).toFixed(1) + '%'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/users
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
        const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/user-intelligence/:userId
// @desc    Get detailed history and RL progress for a student
// @access  Private/Admin
router.get('/user-intelligence/:userId', auth, async (req, res) => {
    try {
        console.log(`[ADMIN-INTEL] Incoming request for userId: ${req.params.userId} from admin: ${req.user.id}`);
        if (req.user.role !== 'admin') {
            console.log(`[ADMIN-INTEL] Unauthorized role: ${req.user.role}`);
            return res.status(403).json({ msg: 'Access denied' });
        }

        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            console.log(`[ADMIN-INTEL] User not found: ${req.params.userId}`);
            return res.status(404).json({ msg: 'User not found' });
        }

        const Interaction = require('../models/Interaction');
        const interactions = await Interaction.find({ user_id: req.params.userId })
            .sort({ timestamp: -1 })
            .limit(50);
        
        console.log(`[ADMIN-INTEL] Interactions found: ${interactions.length}`);

        // Get latest interaction for RL context
        const latest = interactions[0] || {};
        
        // Proxy to ML Service for RL Vitals
        let rlVitals = null;
        try {
            const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
            console.log(`[ADMIN-INTEL] Calling ML Service at ${mlServiceUrl}/get-state-vitals (User: ${user.name})`);
            
            const vitalsRes = await axios.post(`${mlServiceUrl}/get-state-vitals`, {
                retention: user.retention_score ?? 0.8,
                days_since_last_review: latest.time_since_last_review ?? 0,
                complexity: latest.complexity ?? 'medium',
                last_quiz_score: latest.quiz_result ?? 0.7,
                last_content_type: latest.actual_modality || latest.module_type || 'read_write',
                engagement_level: 1 // Default to active for admin view
            }, { timeout: 30000 }); // 30s timeout for cold starts

            rlVitals = vitalsRes.data;
            console.log(`[ADMIN-INTEL] ML Service Vitals successfully fetched for ${user.name}`);
        } catch (mlErr) {
            console.error(`[ADMIN-INTEL] ML Service Vitals failed for ${user.name}:`, mlErr.message);
            if (mlErr.code === 'ECONNABORTED') console.error('[ADMIN-INTEL] Service timed out (Cold Start?)');
            // Don't fail the whole route, just proxy a null vital
        }

        res.json({
            user,
            interactions,
            rlVitals
        });
    } catch (err) {
        console.error(`[ADMIN-INTEL-FATAL] Server Error:`, err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
