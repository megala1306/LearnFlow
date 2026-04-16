const path = require('path');
const mongoose = require(path.join(process.cwd(), 'backend', 'node_modules', 'mongoose'));
const LearningUnit = require(path.join(process.cwd(), 'backend', 'models', 'LearningUnit'));

async function sync() {
  try {
    await mongoose.connect('mongodb://localhost:27017/learnflow');
    const result = await LearningUnit.updateOne(
      { 
        lessonId: '69cf82faa43ac770098961d7', 
        complexity: 'medium' 
      },
      {
        $set: {
          kinesthetic_prompt: "Task: Use the Slicing operator ([::-1]) and F-Strings from the lesson notes to reverse the name 'Python' and print the result as: 'Hello [reversed_name]'.",
          kinesthetic_expected_output: "Hello nohtyP",
          kinesthetic_initial_code: "name = 'Python'\n# Your logic here\n"
        }
      }
    );
    console.log(`Successfully updated: ${result.modifiedCount} unit(s)`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
sync();
