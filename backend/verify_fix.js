const mongoose = require('mongoose');
const LearningUnit = require('./models/LearningUnit');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const unit = await LearningUnit.findOne({ 'quiz_questions.0': { $exists: true } });
  console.log(JSON.stringify(unit.quiz_questions[0], null, 2));
  process.exit(0);
}
check();
