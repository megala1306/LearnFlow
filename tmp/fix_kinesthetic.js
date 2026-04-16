const mongoose = require('./backend/node_modules/mongoose');
const LearningUnit = require('./backend/models/LearningUnit');

async function fix() {
  try {
    await mongoose.connect('mongodb://localhost:27017/learnflow');
    
    // Update the Medium Kinesthetic module for Python Essentials & Syntax
    const result = await LearningUnit.updateOne(
      { 
        lessonId: '69cf82faa43ac770098961d7', 
        complexity: 'medium' 
      },
      {
        $set: {
          kinesthetic_prompt: "Write a function 'process_memory' that reverses 'LearnFlow' using slicing and returns 'Protocol Reversed: [result]'.",
          kinesthetic_expected_output: "Protocol Reversed: wolFnrAeL"
        }
      }
    );
    
    console.log(`Update status: ${result.modifiedCount} unit(s) modified.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
