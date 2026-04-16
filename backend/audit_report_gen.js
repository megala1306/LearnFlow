const mongoose = require('mongoose');
const LearningUnit = require('./models/LearningUnit');
const Interaction = require('./models/Interaction');
const Subject = require('./models/Subject');
const Lesson = require('./models/Lesson');
require('dotenv').config();

async function generateKnowledgeDensityReport() {
    console.log('--- 📊 KNOWLEDGE DENSITY REPORT GENERATION START ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnflow');

        const subjects = await Subject.find({});
        const units = await LearningUnit.find({});
        const interactions = await Interaction.find({});

        const report = {
            subjects: [],
            totalQuestions: 0,
            globalAvgAccuracy: 0,
            modalityEngagement: { video: 0, audio: 0, read_write: 0, kinesthetic: 0 }
        };

        let totalAcc = 0;
        let accCount = 0;

        for (const sub of subjects) {
            const lessons = await Lesson.find({ subject: sub._id });
            const lessonIds = lessons.map(l => l._id);
            const subUnits = units.filter(u => lessonIds.some(lid => lid.equals(u.lessonId)));
            
            let subQCount = 0;
            subUnits.forEach(u => subQCount += (u.quiz_questions || []).length);
            
            const subInteractions = interactions.filter(i => i.subject_id && i.subject_id.equals(sub._id));
            let subAvgAcc = 0;
            if (subInteractions.length > 0) {
                subAvgAcc = subInteractions.reduce((acc, i) => acc + (i.quiz_result || 0), 0) / subInteractions.length;
            }

            report.subjects.push({
                name: sub.title,
                units: subUnits.length,
                questions: subQCount,
                avgAccuracy: subAvgAcc,
                status: subAvgAcc < 0.6 && subInteractions.length > 0 ? "WEAK" : "STABLE"
            });

            report.totalQuestions += subQCount;
            totalAcc += subAvgAcc * subInteractions.length;
            accCount += subInteractions.length;
        }

        report.globalAvgAccuracy = accCount > 0 ? totalAcc / accCount : 0;

        interactions.forEach(i => {
            const mod = i.actual_modality || i.module_type;
            if (report.modalityEngagement[mod] !== undefined) {
                report.modalityEngagement[mod]++;
            }
        });

        console.log('✅ Subject Coverage & Performance:');
        report.subjects.forEach(s => {
            console.log(` - ${s.name}: ${s.questions} Questions | ${s.units} Units | Accuracy: ${(s.avgAccuracy * 100).toFixed(1)}% [${s.status}]`);
        });

        console.log(`✅ Total Knowledge Density: ${report.totalQuestions} Expert Parameters.`);
        console.log(`✅ Global Mastery Index: ${(report.globalAvgAccuracy * 100).toFixed(1)}%`);
        console.log(`✅ Modality Heatmap: ${JSON.stringify(report.modalityEngagement)}`);

        console.log('--- 📊 KNOWLEDGE DENSITY REPORT GENERATION COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('Report Generation Failed:', err.message);
        process.exit(1);
    }
}

generateKnowledgeDensityReport();
