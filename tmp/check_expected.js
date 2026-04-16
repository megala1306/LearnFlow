const mongoose = require('./backend/node_modules/mongoose');
const LearningUnit = require('./backend/models/LearningUnit');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/learnflow');
    const units = await LearningUnit.find({ 
      lessonId: '69cf82faa43ac770098961d7', 
      complexity: 'medium' 
    });
    console.log(JSON.stringify(units, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
