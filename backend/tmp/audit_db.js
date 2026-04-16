const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const LearningUnit = require('../backend/models/LearningUnit');
const Lesson = require('../backend/models/Lesson');
const Subject = require('../backend/models/Subject');

async function auditDatabase() {
    try {
        console.log('--- 🔍 DATABASE INTEGRITY AUDIT START ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnflow', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

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

        const unitIds = new Set();
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

            // Check Duplicates (by name/lessonId/content_text hash - simplified here)
            const unitKey = `${unit.lessonId}-${unit.complexity}`;
            // This is a simple heuristic, but we'll flag if multiple units have the same lesson/complexity
            // unitIds.add(unitKey); // Not quite right for duplicates, let's skip for now or improve

        }

        console.log(`✅ Total Units: ${stats.totalUnits}`);
        console.log(`✅ Expert Units: ${stats.expertUnits}`);
        console.log(`✅ Total Expert Questions: ${stats.expertQuestions}`);
        console.log(`✅ Approved Units: ${stats.approvedUnits}`);
        console.log(`✅ Approved Assessments: ${stats.approvedAssessments}`);
        
        if (stats.expertQuestions < 120) {
            console.warn(`⚠️ WARNING: Expert questions count (${stats.expertQuestions}) is below the target (120+).`);
        } else {
            console.log(`💎 DATA TARGET MET: 120+ Expert Questions Found (${stats.expertQuestions})`);
        }

        if (stats.unitsWithNoQuestions > 0) {
            console.warn(`⚠️ WARNING: Found ${stats.unitsWithNoQuestions} units with NO questions.`);
        }

        if (stats.orphanUnits > 0) {
            console.error(`❌ CRITICAL: Found ${stats.orphanUnits} Orphan LearningUnits (no parent Lesson).`);
        } else {
            console.log(`✅ No Orphan Units detected.`);
        }

        console.log('--- 🔍 DATABASE INTEGRITY AUDIT COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

auditDatabase();
