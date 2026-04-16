
import sys
import os

# Add ml-service directory to path
sys.path.append(os.path.join(os.getcwd(), 'ml-service'))

from nlp.question_generator import generate_questions

test_transcript = "Python is a high-level programming language. It is used for web development and data analysis. Variables are used to store data. Functions allow code reuse. Let's learn about Python syntax in this lesson."

# Test Case 1: Minimal content
print("Testing with minimal content...")
questions = generate_questions(test_transcript, "easy", "read_write", "Python Mastery")

print(f"Total Questions: {len(questions)}")
for i, q in enumerate(questions):
    print(f"{i+1}. [{q['source']}] {q['question']} -> {q['answer']}")
    assert len(q['options']) == 4
    assert q['source'] in ['lesson', 'related', 'general']

assert len(questions) == 10
print("\nSuccess: Exactly 10 high-quality questions generated with tiered fallback.")
