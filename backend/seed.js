const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Subject = require('./models/Subject');
const Lesson = require('./models/Lesson');
const Module = require('./models/Module');
const LearningUnit = require('./models/LearningUnit');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Lesson.deleteMany({});
        await Module.deleteMany({});
        await LearningUnit.deleteMany({});

        // Create Admin
        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('admin123', salt);
        const admin = new User({
            name: 'Admin User',
            email: 'admin@learnflow.com',
            password: adminPass,
            role: 'admin'
        });
        await admin.save();
        console.log('Admin created.');

        // Create Subject
        const subject = new Subject({
            title: 'Python Mastery: Zero to Hero',
            description: 'A comprehensive, adaptive journey through Python programming, optimized for long-term retention.'
        });
        await subject.save();

        const lessonTopics = [
            { title: 'Variables & Data Types', topics: ['Integers', 'Strings', 'Booleans', 'Lists'] },
            { title: 'Control Flow', topics: ['If Statements', 'Elif', 'Else', 'Logic Operators'] },
            { title: 'Loops & Iteration', topics: ['For Loops', 'While Loops', 'Range', 'Break/Continue'] },
            { title: 'Functions & Modules', topics: ['Def', 'Arguments', 'Return', 'Importing'] }
        ];

        const moduleTypes = ['video', 'audio', 'read_write', 'kinesthetic'];
        const complexities = ['easy', 'medium', 'hard'];

        for (let l = 0; l < 4; l++) {
            const lesson = new Lesson({
                subject: subject._id,
                lesson_number: l + 1,
                title: `Lesson ${l + 1}: ${lessonTopics[l].title}`,
                unlock_status: l === 0
            });
            await lesson.save();

            for (const mType of moduleTypes) {
                const module = new Module({
                    lesson_id: lesson._id,
                    module_type: mType
                });
                await module.save();

                for (const comp of complexities) {
                    const unit = new LearningUnit({
                        lessonId: lesson._id,
                        module_id: module._id,
                        complexity: comp,
                        isApproved: false, // All start as unapproved for review
                        content_text: `Detailed ${comp} explanation of ${lessonTopics[l].topics[0]} in a ${mType} format.`,
                        
                        // Video Script for Review
                        video_script: mType === 'video' ? `[SCENE: Animated character standing next to a giant box labeled "${lessonTopics[l].topics[0]}"] \n"Hi there! Today we're visualizing how Python handles ${lessonTopics[l].topics[0]}. Think of it as a..."` : null,
                        
                        // Audio Narration for Review
                        audio_narration: mType === 'audio' ? `Welcome back. In this session, we dive deep into the concept of ${lessonTopics[l].topics[0]}. Listen closely as we explain the nuances of...` : null,

                        visual_video_url: mType === 'video' ? 'https://www.youtube.com/watch?v=kqtD5dpn9C8' : null,
                        auditory_audio_url: mType === 'audio' ? '/audio/placeholder.mp3' : null,
                        auditory_transcript: mType === 'audio' ? `This is the transcript for the auditory lesson on ${lessonTopics[l].topics[0]}.` : null,
                        
                        readwrite_notes: mType === 'read_write' ? [
                            {
                                heading: `Understanding ${lessonTopics[l].topics[0]}`,
                                paragraphs: [`${lessonTopics[l].topics[0]} are fundamental to Python.`, `In this ${comp} level, we focus on the core syntax and common use cases.`],
                                tip: `Always remember to keep your code clean when working with ${lessonTopics[l].topics[0]}.`
                            }
                        ] : [],

                        kinesthetic_prompt: mType === 'kinesthetic' ? `Task: Implement a small logic piece using ${lessonTopics[l].topics[0]}.` : null,
                        kinesthetic_initial_code: mType === 'kinesthetic' ? `# Write your ${comp} code for ${lessonTopics[l].topics[0]} here\n` : null,
                        kinesthetic_expected_output: mType === 'kinesthetic' ? "Success" : null,

                        quiz_questions: [
                            {
                                question: `Critical question about ${lessonTopics[l].topics[0]} (${comp})?`,
                                options: ['Correct Option', 'Wrong A', 'Wrong B', 'Wrong C'],
                                correct_answer: 'Correct Option'
                            }
                        ]
                    });
                    await unit.save();
                }
            }
        }

        console.log('Seeding completed: 4 Lessons x 4 Modules x 3 Complexities = 48 Units (isApproved: false)');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
