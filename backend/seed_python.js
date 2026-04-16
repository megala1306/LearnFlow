const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Lesson = require('./models/Lesson');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

const VIDEO_MAP = [
    { lesson: 1, easy: "mQamOwiW3iM", medium: "LKFrQXaoSMQ", hard: "WbPf4MCIo_U" },
    { lesson: 2, easy: "9XbeXpKMR_E", medium: "FvMPfrgGeKs", hard: "Zp5MuPOtsSY" },
    { lesson: 3, easy: "6iF8Xb7Z3wQ", medium: "94UHCEmprCY", hard: "23vCap6iYSs" },
    { lesson: 4, easy: "89cGQjB5R4M", medium: "LbOwv6y6xjo", hard: "u-OmVr_fT4s" }
];

async function seedPython() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Performing Hard Reset...');
        await Subject.deleteMany({});
        await Lesson.deleteMany({});
        await LearningUnit.deleteMany({});

        const subject = await Subject.create({
            title: "Introduction to Python",
            description: "Master the basics of Python programming with our adaptive learning pathways. This course covers everything from basic syntax to functional programming.",
            category: "Programming",
            difficulty: "Beginner",
            rating: 4.8,
            size: "large"
        });

        const lessonsTitles = [
            "Python Essentials & Syntax",
            "Algorithmic Control Flow",
            "Advanced Data Structures",
            "Functional Programming & Modules"
        ];

        const complexities = ['easy', 'medium', 'hard'];

        const Module = require('./models/Module');
        const modules = ['video', 'audio', 'read_write', 'kinesthetic'];

        for (let i = 0; i < lessonsTitles.length; i++) {
            const lesson = await Lesson.create({
                subject: subject._id,
                lesson_number: i + 1,
                title: lessonsTitles[i],
                unlock_status: i === 0
            });
            console.log(`Created Lesson: ${lesson.title}`);

            // Create Modules for this lesson
            const moduleMap = {};
            for (const mType of modules) {
                const mod = await Module.create({
                    lesson_id: lesson._id,
                    module_type: mType
                });
                moduleMap[mType] = mod._id;
            }

            const vMap = VIDEO_MAP[i];

            for (const comp of complexities) {
                const isHard = comp === 'hard';
                const isMed = comp === 'medium';

                // We create one LearningUnit per complexity, 
                // but we can link it to a primary module or have it float.
                // In this architecture, a LearningUnit contains ALL media, 
                // while Modules are just pointers to the lesson/type.
                
                await LearningUnit.create({
                    lessonId: lesson._id,
                    module_id: moduleMap['video'], // Link to video as primary
                    complexity: comp,
                    content_text: `Mastering ${lessonsTitles[i]} at the ${comp} level.`,
                    video_url: `https://www.youtube.com/watch?v=${vMap[comp]}`,
                    visual_video_url: `https://www.youtube.com/watch?v=${vMap[comp]}`,
                    video_script: `Welcome to the ${comp} module on ${lessonsTitles[i]}. Today we cover fundamental architectural patterns.`,
                    auditory_audio_url: `/audio/lesson${i + 1}_${comp}.mp3`,
                    auditory_transcript: `This audio guide explains ${lessonsTitles[i]} logic for ${comp} learners.`,
                    readwrite_notes: [
                        {
                            heading: `Core Concepts: ${lessonsTitles[i]}`,
                            paragraphs: [
                                `Python is renowned for its readability and elegant syntax. In this ${comp} module, we dive deep into the specific mechanisms that make Python 3 so powerful.`,
                                `Working at a ${comp} level requires understanding not just the 'how', but the 'why' behind the code structure.`,
                                isHard ? "For advanced implementation, we must consider memory efficiency and time complexity in our expressions." : "Focus on basic clarity and using significant indentation to define your program's logic."
                            ],
                            tip: "Readability counts! Follow PEP 8 guidelines for consistent and professional code."
                        }
                    ],
                    kinesthetic_prompt: `Apply the ${comp} logic of ${lessonsTitles[i]} to solve the challenge.`,
                    kinesthetic_initial_code: i === 0 ? "name = 'Python'\n# Print a greeting to the name\n" : "# Implement your logic here\n",
                    kinesthetic_expected_output: i === 0 ? "Hello Python" : "Success",
                    isApproved: true,
                    estimated_duration: isHard ? 20 : isMed ? 15 : 10,
                    quiz_questions: [
                        {
                            question: `Which philosophy is central to ${lessonsTitles[i]} in Python?`,
                            options: ["Readability", "Pointer arithmetic", "Manual memory management", "Boilerplate code"],
                            correct_answer: "Readability"
                        }
                    ]
                });
                console.log(`   - Seeded ${comp} unit`);
            }
        }

        console.log('Seeding Complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedPython();
