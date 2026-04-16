const mongoose = require('mongoose');
const fs = require('fs');
const Lesson = require('./models/Lesson');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

async function syncUltima() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow");
        console.log("Connected to Neural Database...");

        const data = JSON.parse(fs.readFileSync('./ultima_curriculum.json', 'utf8'));
        const lessons = await Lesson.find({});

        for (const lesson of lessons) {
            if (data[lesson.title]) {
                console.log(`\nOverhauling: ${lesson.title} [8-10 Sections]`);
                const lessonData = data[lesson.title];

                for (const complexity of ['easy', 'medium', 'hard']) {
                    const unit = await LearningUnit.findOne({ 
                        lessonId: lesson._id, 
                        complexity: complexity 
                    });

                    if (unit && lessonData[complexity]) {
                        unit.auditory_transcript = lessonData[complexity].transcript;
                        unit.readwrite_notes = lessonData[complexity].notes;
                        unit.content_text = lessonData[complexity].transcript;
                        // Map source "answer" field to schema "correct_answer"
                        unit.quiz_questions = (lessonData[complexity].quiz || []).map(q => ({
                            ...q,
                            correct_answer: q.answer || q.correct_answer, // Sync with schema
                            explanation: q.explanation || "Related to lesson material. Master the core principles."
                        }));

                        await unit.save();
                        console.log(`   - [ULTIMA SYNCED] ${complexity}`);
                    }
                }
            }
        }

        console.log("\nUltima Digital Masterclass is now LIVE.");
        process.exit(0);
    } catch (err) {
        console.error("Sync Failed:", err);
        process.exit(1);
    }
}

syncUltima();
