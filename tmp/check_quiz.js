const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const LearningUnit = require('../backend/models/LearningUnit');

async function checkQuiz() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const unit = await LearningUnit.findOne({ 'quiz_questions.0': { $exists: true } });
        if (unit) {
            console.log('Found unit with quiz questions:');
            console.log(JSON.stringify(unit.quiz_questions[0], null, 2));
        } else {
            console.log('No units with quiz questions found.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkQuiz();
