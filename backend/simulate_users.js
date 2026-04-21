const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Interaction = require('./models/Interaction');
const Lesson = require('./models/Lesson');
const Subject = require('./models/Subject');
const LearningUnit = require('./models/LearningUnit');

// Simulation Config
const USERS_COUNT = 10;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const SUBJECT_ID = "69cf82faa43ac770098961d5"; // From context
const LESSON_IDS = ["69cf82faa43ac770098961d7", "69cf82faa43ac770098961ed", "69cf82faa43ac77009896203"];
const UNIT_DATA = [
    { id: "69cf82faa43ac770098961e1", lessonId: "69cf82faa43ac770098961d7", complexity: "easy" },
    { id: "69cf82faa43ac770098961e5", lessonId: "69cf82faa43ac770098961d7", complexity: "medium" },
    { id: "69cf82faa43ac770098961e9", lessonId: "69cf82faa43ac770098961d7", complexity: "hard" },
    { id: "69cf82faa43ac770098961f7", lessonId: "69cf82faa43ac770098961ed", complexity: "easy" },
    { id: "69cf82faa43ac770098961fb", lessonId: "69cf82faa43ac770098961ed", complexity: "medium" }
];

const userProfiles = [
    { id: 'U1', name: 'Alex Johnson', style: 'video', level: 'advanced', span: 'high', forgetting: 'slow' },
    { id: 'U2', name: 'Ben Smith', style: 'audio', level: 'beginner', span: 'low', forgetting: 'fast' },
    { id: 'U3', name: 'Cathy Lee', style: 'read_write', level: 'intermediate', span: 'medium', forgetting: 'moderate' },
    { id: 'U4', name: 'Dan Brown', style: 'kinesthetic', level: 'beginner', span: 'medium', forgetting: 'fast' },
    { id: 'U5', name: 'Eva Garcia', style: 'video', level: 'intermediate', span: 'high', forgetting: 'slow' },
    { id: 'U6', name: 'Faye Wang', style: 'read_write', level: 'beginner', span: 'low', forgetting: 'moderate' },
    { id: 'U7', name: 'George Miller', style: 'audio', level: 'advanced', span: 'medium', forgetting: 'slow' },
    { id: 'U8', name: 'Hanna Davis', style: 'kinesthetic', level: 'advanced', span: 'high', forgetting: 'moderate' },
    { id: 'U9', name: 'Ian Wright', style: 'video', level: 'beginner', span: 'medium', forgetting: 'moderate' },
    { id: 'U10', name: 'Jack Wilson', style: 'read_write', level: 'intermediate', span: 'low', forgetting: 'fast' }
];

async function simulate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected for simulation...');

        // Clear previous simulation data
        const simUserIds = await User.find({ email: /@sim.learnflow.com/ }).distinct('_id');
        await Interaction.deleteMany({ user_id: { $in: simUserIds } });
        await User.deleteMany({ email: /@sim.learnflow.com/ });

        const logs = [];
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash('simpass123', salt);

        for (const profile of userProfiles) {
            console.log(`Simulating User: ${profile.name} (${profile.id})`);
            
            // 1. Create User
            let user = await User.findOne({ email: `${profile.id.toLowerCase()}@sim.learnflow.com` });
            if (!user) {
                user = new User({
                    name: profile.name,
                    email: `${profile.id.toLowerCase()}@sim.learnflow.com`,
                    password: hashedPass,
                    preferred_learning_style: profile.style,
                    learning_speed: profile.forgetting === 'fast' ? 'slow' : (profile.forgetting === 'slow' ? 'fast' : 'medium'),
                    role: 'student'
                });
                await user.save();
            }

            // 2. Simulate Interactions
            let currentTimestamp = new Date();
            let currentKnowledge = profile.level === 'beginner' ? 0.3 : (profile.level === 'intermediate' ? 0.6 : 0.85);
            let prevKnowledge = currentKnowledge;
            let prevScore = currentKnowledge; // initial baseline

            for (let i = 0; i < 5; i++) { // Each user performs 5 interactions
                const unit = UNIT_DATA[i % UNIT_DATA.length];
                
                // Realistic behavior logic
                let skipChance = profile.span === 'low' ? 0.3 : 0.05;
                let action = Math.random() < skipChance ? 'skip' : 'complete';
                
                if (profile.id === 'U6' && i === 3) action = 'quit'; // Faye drops midway
                if (profile.id === 'U10' && i === 4) action = 'retry'; // Jack retries

                // --- 2.1 ADAPTIVE MODALITY SELECTION (STATE ATTRIBUTION FIX) ---
                let currentModality = profile.style;
                try {
                    // We ask the AI: "Given I just got 'prevScore', what should I do?"
                    const vitalsRes = await axios.post(`${ML_SERVICE_URL}/get-state-vitals`, {
                        retention: prevKnowledge, 
                        time_since_review: 0,
                        complexity: unit.complexity,
                        last_quiz_score: prevScore, 
                        last_content_type: profile.style, // simplified for sim
                        engagement_level: 1
                    });
                    
                    if (vitalsRes.data && vitalsRes.data.content && vitalsRes.data.content.recommendation) {
                        currentModality = vitalsRes.data.content.recommendation;
                        console.log(`[SIM-RL] User ${profile.id} (Prev: ${(prevScore*100).toFixed(0)}%) -> AI recommended: ${currentModality.toUpperCase()}`);
                    }
                } catch (vErr) {
                    console.error(`[SIM-RL-VITAL-ERR] ${vErr.message}`);
                }
                
                // Final safety check
                if (!currentModality) currentModality = profile.style;

                let baseTime = unit.complexity === 'easy' ? 120 : (unit.complexity === 'medium' ? 300 : 600);
                let timeMod = profile.span === 'high' ? 1.2 : (profile.span === 'low' ? 0.6 : 1.0);
                let timeSpent = action === 'skip' ? Math.floor(baseTime * 0.1) : Math.floor(baseTime * timeMod + (Math.random() * 60));

                let quizScore;
                if (action === 'skip') {
                    quizScore = 0;
                } else {
                    let baseScore = currentKnowledge * 100;
                    
                    // Modality match bonus/penalty
                    if (currentModality === profile.style) {
                        baseScore += 10; // Boost for preference
                    } else {
                        baseScore -= 15; // Penalty for non-preference (unless trained better)
                    }

                    let complexityPenalty = unit.complexity === 'hard' ? 20 : (unit.complexity === 'medium' ? 10 : 0);
                    quizScore = Math.max(0, Math.min(100, Math.floor(baseScore - complexityPenalty + (Math.random() * 15 - 5))));
                }

                // Adaptive system logic
                let systemAction = 'No Review';
                if (quizScore < 50) systemAction = 'Immediate Review';
                else if (quizScore < 70) systemAction = 'Light Review';

                let difficultyLevel = unit.complexity.charAt(0).toUpperCase() + unit.complexity.slice(1);
                
                // Record Interaction
                const interaction = new Interaction({
                    user_id: user._id,
                    subject_id: SUBJECT_ID,
                    lesson_id: unit.lessonId,
                    learning_unit_id: unit.id,
                    module_type: profile.style, // preferred
                    actual_modality: currentModality, // what they actually used (AI directed)
                    time_spent: { [currentModality]: timeSpent },
                    complexity: unit.complexity,
                    time_since_last_review: 0,
                    predicted_retention: quizScore / 100,
                    recommended_action: systemAction.toLowerCase().replace(' ', '_'),
                    quiz_result: quizScore / 100,
                    quiz_score: quizScore,
                    timestamp: new Date(currentTimestamp)
                });
                await interaction.save();

                // 2.2 Update User Stats (Logic from assessment.js)
                const xpGained = quizScore >= 70 ? 50 : 20;
                user.xp_points = (user.xp_points || 0) + xpGained;

                let rsEntry = user.revisionSchedule.find(rs => rs.unit_id.toString() === unit.id);
                const nextReviewDate = new Date(currentTimestamp.getTime() + (quizScore < 70 ? 1 : 24) * 60 * 60 * 1000);

                if (rsEntry) {
                    rsEntry.complexity = difficultyLevel.toLowerCase();
                    rsEntry.retention = quizScore / 100;
                    rsEntry.next_review = nextReviewDate;
                    rsEntry.last_reviewed = new Date(currentTimestamp);
                    rsEntry.scoreHistory.push({ score: quizScore, accuracy: quizScore / 100 });
                } else {
                    user.revisionSchedule.push({
                        unit_id: unit.id,
                        lessonId: unit.lessonId,
                        subjectId: SUBJECT_ID,
                        complexity: difficultyLevel.toLowerCase(),
                        retention: quizScore / 100,
                        next_review: nextReviewDate,
                        last_reviewed: new Date(currentTimestamp),
                        scoreHistory: [{ score: quizScore, accuracy: quizScore / 100 }]
                    });
                }

                // Handle Completed Lessons
                if (quizScore >= 70) {
                    let subProgress = user.completedLessons.find(cl => cl.subjectId.toString() === SUBJECT_ID);
                    if (!subProgress) {
                        subProgress = { subjectId: SUBJECT_ID, lessons: [] };
                        user.completedLessons.push(subProgress);
                        subProgress = user.completedLessons[user.completedLessons.length - 1];
                    }
                    if (!subProgress.lessons.some(id => id.toString() === unit.lessonId.toString())) {
                        subProgress.lessons.push(unit.lessonId);
                        user.currentLesson = unit.lessonId;
                    }
                }

                // This block was a duplicate and has been removed.

                // --- 2.3 RL FEEDBACK LOOP (NEW: SYNC WITH ML ENGINE) ---
                try {
                    // A. Timing Model Feedback
                    const timingActionIdx = quizScore >= 70 ? 0 : (quizScore >= 50 ? 1 : 2);
                    const timingReward = quizScore >= 70 ? 1.0 : (quizScore >= 50 ? 0.4 : -1.0);
                    
                    await axios.post(`${ML_SERVICE_URL}/update-q`, {
                        retention: currentKnowledge, // state at start
                        days_since_last_review: 0,
                        complexity: unit.complexity,
                        action: timingActionIdx,
                        reward: timingReward,
                        next_retention: quizScore / 100, // next state
                        next_days: 0,
                        next_complexity: unit.complexity
                    });

                    // B. Content Modality Feedback
                    const contentReward = quizScore >= 70 ? 1.0 : (quizScore >= 50 ? 0.5 : -1.0);
                    await axios.post(`${ML_SERVICE_URL}/update-content-q`, {
                        retention: prevKnowledge, // STATE BEFORE
                        last_quiz_score: prevScore, // STATE BEFORE
                        last_content_type: profile.style, // simplified
                        engagement_level: quizScore >= 60 ? 1 : 0,
                        actual_content_used: currentModality, // ACTION TAKEN
                        reward: contentReward,
                        next_retention: quizScore / 100, // STATE AFTER
                        next_quiz_score: quizScore / 100 // STATE AFTER
                    });
                    
                } catch (mlErr) {
                    console.error(`[SIM-RL-ERR] Failed to sync reward for ${profile.id}: ${mlErr.message}`);
                }

                // ... (rest of loop logic)
                if (action === 'complete' && quizScore > 70) {
                    currentKnowledge += 0.05;
                }
                
                // --- TRACK PREV FOR NEXT STEP ---
                prevKnowledge = currentKnowledge;
                prevScore = quizScore / 100;

                currentTimestamp = new Date(currentTimestamp.getTime() + (timeSpent + 30) * 1000); // 30s gap
                
                if (action === 'quit') break;
            }

            // 3. RECALCULATE GLOBAL RETENTION SCORE
            // ... (retention calculation code)
            if (user.revisionSchedule && user.revisionSchedule.length > 0) {
                let totalWeightedRetention = 0;
                let totalWeight = 0;
                const now = currentTimestamp;

                user.revisionSchedule.forEach(item => {
                    const hoursSinceReview = (now - new Date(item.last_reviewed || now)) / (1000 * 60 * 60);
                    let weight = 0.4;
                    if (hoursSinceReview <= 24) weight = 1.0;
                    else if (hoursSinceReview <= 72) weight = 0.7;

                    totalWeightedRetention += (item.retention || 0.85) * weight;
                    totalWeight += weight;
                });
                user.retention_score = parseFloat((totalWeightedRetention / totalWeight).toFixed(2));
            }

            // --- 4. STATE HORIZON PRIMING (REFINED) ---
            try {
                const finalLog = logs.filter(l => l.userId === profile.id).slice(-1)[0];
                const finalScore = finalLog?.quizScore || 0;
                await axios.post(`${ML_SERVICE_URL}/update-content-q`, {
                    retention: user.retention_score,
                    last_quiz_score: finalScore / 100,
                    last_content_type: finalLog?.contentType?.toLowerCase() || profile.style,
                    engagement_level: 1,
                    actual_content_used: finalLog?.contentType?.toLowerCase() || profile.style,
                    reward: 0, // NO hardcoded bonus. Stay neutral to avoid phantom recommendations.
                    next_retention: user.retention_score,
                    next_quiz_score: finalScore / 100
                });
                console.log(`[SIM-RL] Neutral-Primed Final State for ${profile.id}`);
            } catch (pErr) {
                console.error(`[SIM-RL-PRIME-ERR] ${pErr.message}`);
            }

            await user.save();
        }

        // 3. Export to JSON
        const fs = require('fs');
        fs.writeFileSync(path.join(__dirname, 'user_interaction_logs.json'), JSON.stringify(logs, null, 2));
        
        // 4. Generate Summary
        const summary = userProfiles.map(p => {
            const userLogs = logs.filter(l => l.userId === p.id);
            const totalScore = userLogs.reduce((sum, l) => sum + l.quizScore, 0);
            return {
                userId: p.id,
                name: p.name,
                progress: `${userLogs.length}/5 Lessons Interaction`,
                completionRate: (userLogs.filter(l => l.action === 'complete').length / 5 * 100).toFixed(0) + '%',
                averageScore: (totalScore / (userLogs.length || 1)).toFixed(1),
                weakTopics: p.level === 'beginner' ? ['Core Syntax', 'Data Management'] : (userLogs.some(l => l.quizScore < 60) ? ['Complex Logic'] : []),
                engagementLevel: p.span === 'high' ? 'High' : (p.span === 'low' ? 'Low' : 'Medium')
            };
        });

        fs.writeFileSync(path.join(__dirname, 'admin_summary.json'), JSON.stringify(summary, null, 2));

        console.log('Simulation complete. Artifacts generated.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulate();
