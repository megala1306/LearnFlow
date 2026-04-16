const express = require("express");
const router = express.Router();
const axios = require("axios");
const LearningUnit = require("../models/LearningUnit");
const Module = require("../models/Module");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");
const User = require("../models/User");
const Lesson = require("../models/Lesson");

const ML_SERVICE = process.env.ML_SERVICE_URL || "http://localhost:8000";

// --- RANDOMIZATION UTILITY ---
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// --------------------------------
// 1️⃣ Generate assessment questions
// --------------------------------
router.get("/:unitId", async (req, res) => {
  try {
    const unit = await LearningUnit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    if (!unit.isAssessmentApproved) {
      return res.status(403).json({ message: "This assessment is currently pending admin approval. You cannot access it yet." });
    }

    // --- PRIORITIZATION: Expert Questions ---
    if (unit.quiz_questions && unit.quiz_questions.length > 0) {
        console.log(`[ASSESSMENT-SYNC] Serving Randomized Expert Questions for Unit: ${unit._id}`);
        
        let allQuestions = unit.quiz_questions.map(q => ({
            questionId: q._id,
            question: q.question,
            options: shuffleArray(q.options || []),
            correct_answer: q.correct_answer || q.answer,
            explanation: q.explanation || "Related to lesson material."
        }));

        const shuffledQuestions = shuffleArray(allQuestions);

        // --- NEW: RICH METADATA FOR "WOW" FACTOR ---
        const complexity = unit.complexity || "easy";
        const estTime = `${Math.ceil(shuffledQuestions.length * 0.8)} - ${shuffledQuestions.length} Mins`;
        const category = complexity === 'hard' ? "Deep Cognitive Analysis" : complexity === 'medium' ? "Intermediate Concept Sync" : "Fundamental Knowledge Probe";
        const protocol = `SYNC-7X-${Math.floor(Math.random() * 900) + 100}`;

        return res.json({
            unitId: unit._id,
            difficulty: complexity,
            questions: shuffledQuestions,
            isExpert: true,
            estimatedTime: estTime,
            moduleCategory: category,
            protocolLabel: protocol
        });
    }

    const lesson = await Lesson.findById(unit.lessonId);
    let subjectName = "Computer Science";
    if (lesson) {
        const subject = await Subject.findById(lesson.subject);
        if (subject) subjectName = subject.title;
    }

    // AI Generation Fallback
    const complexity = unit.complexity || "easy";
    const response = await axios.post(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/generate-assessment`, {
      transcript: unit.auditory_transcript || unit.content_text || "",
      difficulty: complexity,
      content_type: "read_write",
      subject_name: subjectName
    }, { timeout: 15000 });

    const questions = response.data.questions;
    if (!questions || questions.length === 0) throw new Error("ML Service returned empty questions.");

    res.json({
      unitId: unit._id,
      difficulty: complexity,
      questions: questions,
      estimatedTime: "5 - 8 Mins",
      moduleCategory: "AI-Generated Assessment",
      protocolLabel: "AUTO-GEN-SYNC"
    });

  } catch (error) {
    console.error(`[ASSESSMENT-SYNC-ERR] ${error.message}`);
    res.status(200).json({
      unitId: req.params.unitId,
      difficulty: "easy",
      questions: [
        {
          question: "Based on the Ebbinghaus model, what happens to knowledge without review?",
          options: ["It decays exponentially", "It stays constant", "It grows over time", "It follows a linear path"],
          correct_answer: "It decays exponentially",
          explanation: "Forgetting follows an exponential curve unless reinforced."
        }
      ],
      estimatedTime: "2 Mins",
      moduleCategory: "Emergency Fallback",
      protocolLabel: "FALLBACK-SAFE-SYNC"
    });
  }
});

const { auth } = require('../middleware/auth');

// --------------------
// POST Submit Quiz & Adaptive Analytics Sync
// --------------------
router.post("/submit", auth, async (req, res) => {
  try {
    const { unitId, answers, questions, modality, time_spent } = req.body;
    const userId = req.user.id;
    if (!unitId || !answers || !questions) return res.status(400).json({ error: "Missing assessment data." });

    console.log(`[ASSESSMENT-SYNC] User ${userId} submitting with Modality: ${modality || 'default'}`);

    let score = 0;
    const totalQuestions = questions.length;
    const submissionDetails = [];

    answers.forEach((ans, index) => {
      const q = questions[index];
      if (!q) return;
      const normalize = (str) => (str || "").trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
      const selectedOption = typeof ans === 'string' ? ans : (ans?.selectedAnswer || "");
      const isCorrect = normalize(selectedOption) === normalize(q.correct_answer);
      if (isCorrect) score++;

      submissionDetails.push({
        questionId: q.questionId || index,
        question: q.question,
        selectedAnswer: selectedOption,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation || "No explanation provided."
      });
    });

    // --- AUTO-DETECT MODALITY (Fail-Safe) ---
    let finalModality = modality;
    if (!finalModality && time_spent) {
        // If modality is missing but time_spent is there, pick the one with the most time
        const entries = Object.entries(time_spent);
        if (entries.length > 0) {
            const maxEntry = entries.reduce((prev, curr) => curr[1] > prev[1] ? curr : prev);
            if (maxEntry[1] > 0) {
                finalModality = maxEntry[0];
                console.log(`[ASSESSMENT-SYNC] Auto-detected modality from time_spent: ${finalModality}`);
            }
        }
    }


    const accuracy = totalQuestions > 0 ? (score / totalQuestions) : 0;
    let nextDifficulty = "easy";
    let recommendation = "repeat";
    const unit = await LearningUnit.findById(unitId);
    if (!unit) return res.status(404).json({ error: "Unit not found." });
    const module = unit.module_id ? await Module.findById(unit.module_id) : null;


    try {
      console.log(`[ASSESSMENT-SYNC] Requesting ML Calibration for User: ${userId}`);
      const mlResponse = await axios.post(`${ML_SERVICE}/update-performance`, { 
        userId, unitId, score, totalQuestions, accuracy, answers: submissionDetails 
      }, { timeout: 10000 }); // 10s timeout to prevent hanging

      nextDifficulty = mlResponse.data.nextDifficulty;
      recommendation = mlResponse.data.recommendation;
      console.log(`[ASSESSMENT-SYNC] ML Response: ${recommendation} | Next: ${nextDifficulty}`);
    } catch (mlErr) {
      console.error(`[ASSESSMENT-SYNC-WARNING] ML Service unreachable or timed out: ${mlErr.message}. Using heuristic fallback.`);
      if (accuracy >= 0.8) { 
        nextDifficulty = "hard"; 
        recommendation = "next_lesson"; 
      } else if (accuracy >= 0.6) { 
        nextDifficulty = "medium"; 
        recommendation = "practice"; 
      } else { 
        nextDifficulty = "easy"; 
        recommendation = "repeat"; 
      }
    }

    let user = await User.findById(userId);
    let nextLessonId = null;

    if (user) {
      const xpGained = recommendation === "next_lesson" ? 50 : 20;
      user.xp_points = (user.xp_points || 0) + xpGained;

      let rsEntry = user.revisionSchedule.find(rs => rs.unit_id.toString() === unitId);
      const nextReviewDate = accuracy < 0.8 ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (rsEntry) {
        rsEntry.complexity = nextDifficulty;
        rsEntry.retention = accuracy;
        rsEntry.next_review = nextReviewDate;
        rsEntry.last_reviewed = new Date();
        rsEntry.scoreHistory.push({ score, accuracy });
      } else {
        user.revisionSchedule.push({ 
          unit_id: unitId, 
          lessonId: unit.lessonId, 
          complexity: nextDifficulty, 
          retention: accuracy, 
          next_review: nextReviewDate, 
          last_reviewed: new Date(),
          scoreHistory: [{ score, accuracy }] 
        });
      }
      user.markModified('revisionSchedule');

      if (recommendation === "next_lesson" && unit) {
        const lesson = await Lesson.findById(unit.lessonId);
        if (lesson) {
          let subProgress = user.completedLessons.find(cl => cl.subjectId.toString() === lesson.subject.toString());
          if (!subProgress) {
            subProgress = { subjectId: lesson.subject, lessons: [] };
            user.completedLessons.push(subProgress);
            subProgress = user.completedLessons[user.completedLessons.length - 1];
          }
          if (!subProgress.lessons.some(id => id.toString() === lesson._id.toString())) subProgress.lessons.push(lesson._id);
          const allLessons = await Lesson.find({ subject: lesson.subject }).sort({ lesson_number: 1 });
          const currentIdx = allLessons.findIndex(l => l._id.toString() === lesson._id.toString());
          if (currentIdx + 1 < allLessons.length) {
            const potentialNextLesson = allLessons[currentIdx + 1];
            // Check if the next lesson has any approved units
            const approvedUnits = await LearningUnit.countDocuments({ 
                lessonId: potentialNextLesson._id, 
                isApproved: true 
            });
            
            if (approvedUnits > 0) {
                nextLessonId = potentialNextLesson._id;
                user.currentLesson = nextLessonId;
                console.log(`[ASSESSMENT] Advancing User to Approved Lesson: ${potentialNextLesson.title}`);
            } else {
                console.log(`[ASSESSMENT] Next Lesson ${potentialNextLesson.title} is NOT approved yet. Keeping user on current lesson.`);
            }
          } else {
            recommendation = "course_complete";
          }
          user.markModified('completedLessons');
        }
      }

      const { calculateAggregateRetention } = require('../utils/retentionUtils');

      // --- RECALCULATE GLOBAL RETENTION SCORE ---
      user.retention_score = calculateAggregateRetention(user.revisionSchedule, user.forgetting_rate);

      // --- SYNC INTERACTION RECORD FOR NEURAL FLOW HEATMAP ---
      const Interaction = require('../models/Interaction');
      const newInteraction = new Interaction({
        user_id: userId,
        subject_id: unit.lessonId ? (await Lesson.findById(unit.lessonId))?.subject : null,
        lesson_id: unit.lessonId,
        learning_unit_id: unitId,
        module_type: module?.module_type || 'read_write',
        actual_modality: finalModality || module?.module_type || 'read_write',
        time_spent: time_spent || {
            video: 0,
            audio: 0,
            read_write: 0,
            kinesthetic: 0
        },
        complexity: unit.complexity || 'easy',
        time_since_last_review: 0,
        predicted_retention: accuracy,
        recommended_action: recommendation === 'repeat' ? 'immediate_review' : 'no_review',
        quiz_result: accuracy,
        quiz_score: score
      });
      const interactionRecord = await newInteraction.save();

      // --- 3. REINFORCEMENT LEARNING: UPDATE Q-TABLES ---
      // This is the CRITICAL feedback loop that allows the AI to learn
      try {
        const statsAtSubmission = {
            retention: unit.complexity === 'hard' ? 0.9 : unit.complexity === 'medium' ? 0.7 : 0.5, // Heuristic if not provided
            days_since: 0, 
            complexity: unit.complexity || 'easy',
            action_idx: accuracy >= 0.8 ? 0 : accuracy >= 0.6 ? 1 : 2
        };

        // A. Timing Model Update (Reward Signal)
        const timingReward = accuracy >= 0.8 ? 1.0 : accuracy >= 0.6 ? 0.4 : -1.0;
        await axios.post(`${ML_SERVICE}/update-q`, {
            retention: statsAtSubmission.retention,
            days_since_last_review: statsAtSubmission.days_since,
            complexity: statsAtSubmission.complexity,
            action: statsAtSubmission.action_idx,
            reward: timingReward,
            next_retention: accuracy, // Using new accuracy as next state
            next_days: 0,
            next_complexity: statsAtSubmission.complexity
        });

        // B. Content Model Update (Multimodal Reward)
        const contentReward = accuracy >= 0.8 ? 1.0 : accuracy >= 0.6 ? 0.5 : -0.5;
        await axios.post(`${ML_SERVICE}/update-content-q`, {
            retention: statsAtSubmission.retention,
            last_quiz_score: accuracy,
            last_content_type: interactionRecord.module_type,
            engagement_level: accuracy >= 0.6 ? 1 : 0,
            actual_content_used: interactionRecord.module_type,
            reward: contentReward,
            next_retention: accuracy,
            next_quiz_score: accuracy
        });
        console.log(`[RL-SYNC] Successfully propagated rewards for User: ${userId}`);
      } catch (rlErr) {
        console.error(`[RL-SYNC-ERR] Failed to propagate RL rewards: ${rlErr.message}`);
      }

      await user.save();
    }

    res.json({
      score,
      accuracy,
      results: submissionDetails,
      nextDifficulty,
      recommendation,
      nextLessonId,
      xp: (user && user.xp_points) || 0
    });

  } catch (error) {
    console.error("[ASSESSMENT-SYNC FATAL ERROR]:", error.stack || error.message || error);
    res.status(500).json({ error: "Assessment submission failed." });
  }
});

// ---------------------------------------------------------------
// LIGHT REVIEW ENDPOINT
// GET /api/assessment/light-review/:unitId
// Returns read/write notes + top 5 most important questions
// Triggered when RL engine selects action: light_review
// ---------------------------------------------------------------
router.get("/light-review/:unitId", async (req, res) => {
  try {
    const unit = await LearningUnit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    // 1. Read/Write Notes (pre-structured from admin content)
    let notes = unit.readwrite_notes || [];
    if (notes.length === 0 && unit.content_text) {
        notes = [{
            heading: "Core Concept Review",
            paragraphs: unit.content_text.split('\n').filter(p => p.trim() !== '')
        }];
    }

    // 2. Top 5 Questions — Most important (first 5 without shuffling)
    const allQuestions = unit.quiz_questions || [];
    const top5 = allQuestions.slice(0, 5);

    return res.json({
      unit_id: unit._id,
      review_type: "light_review",
      notes,
      questions: top5,
      total_questions: top5.length
    });
  } catch (err) {
    console.error("[LIGHT-REVIEW]", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
