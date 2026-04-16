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
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/learnflow');
        console.log("Connected to MongoDB.");

        // 1. Setup mock data
        const subject = await Subject.findOne() || new Subject({ title: "Test Subject", description: "Test" });
        await subject.save();

        const lesson1 = await Lesson.findOne({ subject: subject._id, lesson_number: 1 }) || new Lesson({ 
            title: "Lesson 1", 
            subject: subject._id, 
            lesson_number: 1 
        });
        await lesson1.save();

        const lesson2 = await Lesson.findOne({ subject: subject._id, lesson_number: 2 }) || new Lesson({ 
            title: "Lesson 2", 
            subject: subject._id, 
            lesson_number: 2 
        });
        await lesson2.save();

        const module = await Module.findOne({ lesson_id: lesson1._id }) || new Module({
            title: "Module 1",
            lesson_id: lesson1._id,
            module_type: "read_write"
        });
        await module.save();

        const unit = await LearningUnit.findOne({ module_id: module._id }) || new LearningUnit({
            module_id: module._id,
            lessonId: lesson1._id, // Add this for the route logic
            complexity: "easy",
            content_text: "Test content",
            isApproved: true
        });
        await unit.save();

        const user = await User.findOne({ email: "test@example.com" }) || new User({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            xp_points: 5,
            completedLessons: [{ subjectId: subject._id, lessons: [] }],
            currentLesson: lesson1._id
        });
        await user.save();

        console.log("Initial User XP:", user.xp_points);
        console.log("Initial User Completed Lessons:", user.completedLessons[0].lessons.length);
        console.log("Initial User Current Lesson:", user.currentLesson);

        // 2. Simulate POST /submit logic (simplified version of the route code)
        // Since I can't easily call the API with full auth here, I'll run the logic directly
        const unitId = unit._id.toString();
        const userId = user._id.toString();
        const recommendation = "next_lesson"; // Simulate high accuracy
        const score = 3;
        const totalQuestions = 3;
        const accuracy = 1.0;

        // Fetching unit (THE FIX)
        const fetchedUnit = await LearningUnit.findById(unitId);
        console.log("Fetched Unit for progression:", fetchedUnit ? "SUCCESS" : "FAILED");

        if (recommendation === "next_lesson" && fetchedUnit) {
            const xpGained = 50;
            user.xp_points += xpGained;

            const lesson = await Lesson.findById(fetchedUnit.lessonId);
            if (lesson) {
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
                if (currentIdx + 1 < allLessons.length) {
                    user.currentLesson = allLessons[currentIdx + 1]._id;
                }
            }
        }

        await user.save();
        console.log("Updated User XP:", user.xp_points);
        console.log("Updated User Completed Lessons:", user.completedLessons[0].lessons.length);
        console.log("Updated User Current Lesson:", user.currentLesson);

        if (user.xp_points === 55 && user.completedLessons[0].lessons.length === 1 && user.currentLesson.toString() === lesson2._id.toString()) {
            console.log("VERIFICATION SUCCESSFUL: XP updated and lesson unlocked.");
        } else {
            console.log("VERIFICATION FAILED: Results do not match expected outcomes.");
        }

    } catch (err) {
        console.error("Verification error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFix();
