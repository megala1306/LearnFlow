// frontend/components/AdaptiveLearning.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AdaptiveUnit from "./AdaptiveUnit";

const moduleTypes = ["video", "audio", "read_write", "kinesthetic"];

const AdaptiveLearning = ({ subjectId, initialPreferredType }) => {
  const [unit, setUnit] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [preferredModuleType, setPreferredModuleType] = useState(initialPreferredType || "video");

  // Fetch next recommended unit from backend
  const fetchRecommendation = async (type = null) => {
    try {
      setIsSwitching(true);
      const token = localStorage.getItem("token");
      let url = `https://learnflow-backend-79r2.onrender.com/api/recommendations/next?subject_id=${subjectId}`;
      if (type) url += `&module_type=${type}`;

      const res = await axios.get(url, { headers: { "x-auth-token": token } });
      const nextUnit = res.data.unit;
      if (!unit || nextUnit._id !== unit._id) {
        setUnit(nextUnit);
        setLesson(res.data.lesson);
      }

    } catch (err) {
      console.error("Recommendation Error:", err);
    } finally {
      setLoading(false);
      setIsSwitching(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRecommendation(preferredModuleType);
  }, []);

  // Called when user completes a module
  const handleComplete = async (unitId, passed, accuracy, moduleType) => {
    console.log("Completed:", unitId, passed, accuracy, moduleType);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "https://learnflow-backend-79r2.onrender.com/api/units/record",
        { unit_id: unitId, passed, accuracy, module_type: moduleType },
        { headers: { "x-auth-token": token } }
      );
      fetchRecommendation(preferredModuleType);
    } catch (err) {
      console.error("Error recording unit:", err);
    }
  };

  if (loading) return <div className="text-center py-40 text-xl">Loading adaptive content...</div>;

  return (
    <div className="px-4 md:px-12">
      <h1 className="text-3xl font-bold mb-6">{lesson?.title}</h1>

      {/* Module Tabs */}
      <div className="flex gap-4 mb-6">
        {moduleTypes.map((type) => {
          const sectionExists =
            (type === "video" && unit?.visual_video_url) ||
            (type === "audio" && unit?.auditory_audio_url) ||
            (type === "read_write" && unit?.readwrite_notes?.length) ||
            (type === "kinesthetic" && unit?.kinesthetic_prompt);

          return (
            <button
              key={type}
              disabled={!sectionExists || isSwitching}
              onClick={() => setPreferredModuleType(type)}
              className={`px-4 py-2 rounded font-bold ${
                type === preferredModuleType
                  ? "bg-blue-700 text-white"
                  : sectionExists
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Adaptive Unit Content */}
      <AdaptiveUnit
        unit={unit}
        onComplete={handleComplete}
        isSwitching={isSwitching}
        activeType={preferredModuleType}
      />
    </div>
  );
};

export default AdaptiveLearning;