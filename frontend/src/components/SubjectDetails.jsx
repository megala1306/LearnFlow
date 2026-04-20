import { useEffect, useState } from "react";

export default function SubjectDetails() {
  const [subject, setSubject] = useState(null);

  useEffect(() => {
    // Replace with your backend URL
    fetch("https://learnflow-backend-79r2.onrender.com/api/subjects")
      .then(res => res.json())
      .then(data => {
        // Assuming you want the first subject for now
        setSubject(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  if (!subject) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{subject.title}</h1>
      <p className="mt-2">{subject.description}</p>
      <p className="mt-1 text-sm text-gray-500">
        Category: {subject.category} | Difficulty: {subject.difficulty} | Rating: {subject.rating}
      </p>
    </div>
  );
}