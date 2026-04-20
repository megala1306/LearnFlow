import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Assessment({ unitId, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!unitId) return;

    setLoading(true);
    fetch(`https://learnflow-backend-79r2.onrender.com/api/assessment/${unitId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched questions:", data.questions);
        setQuestions(data.questions || []);
        setAnswers(new Array(data.questions.length).fill(null)); // initialize answers
      })
      .catch((err) => console.error("Failed to fetch assessment:", err))
      .finally(() => setLoading(false));
  }, [unitId]);

  const handleAnswer = (qIndex, option) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = option;
    setAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (answers.includes(null)) {
      alert("Please answer all questions before submitting!");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("https://learnflow-backend-79r2.onrender.com/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, answers }),
      });

      const result = await res.json();
      alert(`Score: ${result.score}`);

      // Call onComplete to notify LessonView that this unit is done
      if (onComplete) onComplete(unitId, true, result.score);

      // Optional: navigate to next lesson or show results
      // navigate("/lesson/next");
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      alert("Failed to submit quiz. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center mt-6 text-gray-600">Loading assessment...</p>
    );
  }

  if (questions.length === 0) {
    return <p className="text-center mt-6 text-gray-600">No questions found.</p>;
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold mb-4">Assessment</h2>

      {questions.map((q, index) => (
        <div key={index} className="mb-6 border rounded p-4 bg-white shadow-sm">
          <p className="font-semibold mb-2">{index + 1}. {q.question}</p>

          <div className="flex flex-col space-y-2">
            {q.options.map((opt, i) => {
              const isSelected = answers[index] === opt;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(index, opt)}
                  className={`block w-full text-left border rounded px-3 py-2 ${
                    isSelected
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={submitQuiz}
        disabled={submitting}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Assessment"}
      </button>
    </div>
  );
}