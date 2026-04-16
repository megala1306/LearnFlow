const mongoose = require('mongoose');
require('dotenv').config();

const LearningUnit = require('./models/LearningUnit');
const Lesson = require('./models/Lesson');
const Subject = require('./models/Subject');

async function auditDatabase() {
    try {
        console.log('--- 🔍 DATABASE INTEGRITY AUDIT START ---');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnflow';
        console.log(`Connecting to: ${mongoUri}`);
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB');

        const units = await LearningUnit.find({});
        const lessons = await Lesson.find({});
        const subjects = await Subject.find({});

        const stats = {
            totalUnits: units.length,
            expertUnits: 0,
            expertQuestions: 0,
            unitsWithNoQuestions: 0,
            orphanUnits: 0,
            approvedUnits: 0,
            approvedAssessments: 0,
            duplicateUnits: 0,
            invalidReviewUnits: 0
        };

        const lessonIds = new Set(lessons.map(l => l._id.toString()));

        for (const unit of units) {
            // Check Expert Content
            if (unit.quiz_questions && unit.quiz_questions.length > 0) {
                stats.expertUnits++;
                stats.expertQuestions += unit.quiz_questions.length;
            } else {
                stats.unitsWithNoQuestions++;
            }

            // Check Approvals
            if (unit.isApproved) stats.approvedUnits++;
            if (unit.isAssessmentApproved) stats.approvedAssessments++;

            // Check Orphans
            if (!lessonIds.has(unit.lessonId.toString())) {
                stats.orphanUnits++;
            }
        }

        console.log(`✅ Total Units: ${stats.totalUnits}`);
        console.log(`✅ Expert Units: ${stats.expertUnits}`);
        console.log(`✅ Total Expert Questions: ${stats.expertQuestions}`);
        console.log(`✅ Approved Units: ${stats.approvedUnits}`);
        console.log(`✅ Approved Assessments: ${stats.approvedAssessments}`);
        
        if (stats.expertQuestions < 120) {
            console.warn(`⚠️ WARNING: Expert questions count (${stats.expertQuestions}) is below the target (120+).`);
            console.log("\x1b[31m[FAIL]\x1b[0m Knowledge Density: Target 120+ expert questions NOT met.");
        } else {
            console.log(`💎 DATA TARGET MET: 120+ Expert Questions Found (${stats.expertQuestions})`);
            console.log("\x1b[32m[PASS]\x1b[0m Knowledge Density: Target 120+ expert questions met.");
        }

        if (stats.unitsWithNoQuestions > 0) {
            console.warn(`⚠️ WARNING: Found ${stats.unitsWithNoQuestions} units with NO questions.`);
        }

        if (stats.orphanUnits > 0) {
            console.error(`❌ CRITICAL: Found ${stats.orphanUnits} Orphan LearningUnits (no parent Lesson).`);
        } else {
            console.log(`✅ No Orphan Units detected.`);
            console.log("\x1b[32m[PASS]\x1b[0m Structural Integrity: No orphans found.");
        }

        if (stats.approvedAssessments < stats.totalUnits) {
            console.warn(`⚠️ WARNING: Only ${stats.approvedAssessments}/${stats.totalUnits} assessments are approved.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

auditDatabase();
