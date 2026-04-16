const mongoose = require('mongoose');
const User = require('./models/User');
const Lesson = require('./models/Lesson');
const Subject = require('./models/Subject');
const LearningUnit = require('./models/LearningUnit');
const Module = require('./models/Module');
require('dotenv').config();

async function verifyFix() {
    try {
        console.log("Starting verification...");
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/learnflow';
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB.");

        // 1. Setup mock data
        let subject = await Subject.findOne({ title: "Test Subject" });
        if (!subject) {
            subject = new Subject({ title: "Test Subject", description: "Test" });
            await subject.save();
        }

        let lesson1 = await Lesson.findOne({ subject: subject._id, lesson_number: 1 });
        if (!lesson1) {
            lesson1 = new Lesson({ 
                title: "Lesson 1", 
                subject: subject._id, 
                lesson_number: 1 
            });
            await lesson1.save();
        }

        let lesson2 = await Lesson.findOne({ subject: subject._id, lesson_number: 2 });
        if (!lesson2) {
            lesson2 = new Lesson({ 
                title: "Lesson 2", 
                subject: subject._id, 
                lesson_number: 2 
            });
            await lesson2.save();
        }

        let moduleDoc = await Module.findOne({ lesson_id: lesson1._id });
        if (!moduleDoc) {
            moduleDoc = new Module({
                title: "Module 1",
                lesson_id: lesson1._id,
                module_type: "read_write"
            });
            await moduleDoc.save();
        }

        let unitObj = await LearningUnit.findOne({ module_id: moduleDoc._id });
        if (!unitObj) {
            unitObj = new LearningUnit({
                module_id: moduleDoc._id,
                lessonId: lesson1._id,
                complexity: "easy",
                content_text: "Test content",
                isApproved: true
            });
            await unitObj.save();
        }

        let user = await User.findOne({ email: "test_verification@example.com" });
        if (!user) {
            user = new User({
                name: "Test Verification User",
                email: "test_verification@example.com",
                password: "password123",
                xp_points: 5,
                completedLessons: [{ subjectId: subject._id, lessons: [] }],
                currentLesson: lesson1._id
            });
            await user.save();
        } else {
            // Reset for test
            user.xp_points = 5;
            user.completedLessons = [{ subjectId: subject._id, lessons: [] }];
            user.currentLesson = lesson1._id;
            await user.save();
        }

        console.log("Initial User XP:", user.xp_points);
        console.log("Initial User Current Lesson:", user.currentLesson);

        // 2. RUN ASSESSMENT SUBMISSION LOGIC (Simulated)
        const unitId = unitObj._id.toString();
        const recommendation = "next_lesson"; 
        
        // --- THIS IS THE CRITICAL SECTION TO VERIFY ---
        const unit = await LearningUnit.findById(unitId);
        console.log("Fetched Unit for progression:", unit ? "SUCCESS" : "FAILED");

        if (recommendation === "next_lesson" && unit) {
            const xpGained = recommendation === "next_lesson" ? 50 : 20;
            user.xp_points = (user.xp_points || 0) + xpGained;

            const lesson = await Lesson.findById(unit.lessonId);
            if (lesson) {
                console.log(`Verifying progression for lesson: ${lesson.title}`);
                let subProgress = user.completedLessons.find(cl => cl.subjectId.toString() === lesson.subject.toString());
                if (!subProgress) {
                    subProgress = { subjectId: lesson.subject, lessons: [] };
                    user.completedLessons.push(subProgress);
                    subProgress = user.completedLessons[user.completedLessons.length - 1];
                }

                if (!subProgress.lessons.some(id => id.toString() === lesson._id.toString())) {
                    subProgress.lessons.push(lesson._id);
                }

                const allLessons = await Lesson.find({ subject: lesson.subject }).sort({ lesson_number: 1 });
                const currentIdx = allLessons.findIndex(l => l._id.toString() === lesson._id.toString());
                const nextIdx = currentIdx + 1;
                
                if (nextIdx < allLessons.length) {
                  user.currentLesson = allLessons[nextIdx]._id;
                  console.log(`Successly updated user currentLesson: ${user.currentLesson}`);
                }
            }
        }
        await user.save();

        console.log("Updated User XP:", user.xp_points);
        console.log("Updated User Current Lesson:", user.currentLesson);

        if (user.xp_points === 55 && user.currentLesson.toString() === lesson2._id.toString()) {
            console.log("\n✅ VERIFICATION SUCCESSFUL: XP updated to 55 and next lesson unlocked.");
        } else {
            console.log("\n❌ VERIFICATION FAILED: Requirements not met.");
        }

    } catch (err) {
        console.error("Verification error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFix();
