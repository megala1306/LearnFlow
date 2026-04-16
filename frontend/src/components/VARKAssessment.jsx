import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const QUESTIONS = [
  {
    id: 1,
    text: "When learning a new software tool, you prefer to:",
    options: [
      { text: "Watch a tutorial video walkthrough", style: "video" },
      { text: "Listen to an expert explain the core concepts", style: "audio" },
      { text: "Read the technical documentation first", style: "read_write" },
      { text: "Just start clicking around and try it out", style: "kinesthetic" }
    ]
  },
  {
    id: 2,
    text: "When you study a subject, you learn best by:",
    options: [
      { text: "Watching diagrams or videos", style: "video" },
      { text: "Listening to lectures or podcasts", style: "audio" },
      { text: "Reading books or notes", style: "read_write" },
      { text: "Doing hands-on practice or experiments", style: "kinesthetic" }
    ]
  },
  {
    id: 3,
    text: "When remembering a process, you:",
    options: [
      { text: "Visualize it in your mind", style: "video" },
      { text: "Repeat it out loud", style: "audio" },
      { text: "Write it down step by step", style: "read_write" },
      { text: "Physically perform the steps", style: "kinesthetic" }
    ]
  },
  {
    id: 4,
    text: "If learning a language, you prefer to:",
    options: [
      { text: "Watch videos in that language", style: "video" },
      { text: "Listen to native speakers", style: "audio" },
      { text: "Read and write texts", style: "read_write" },
      { text: "Practice speaking and acting out dialogues", style: "kinesthetic" }
    ]
  },
  {
    id: 5,
    text: "When solving a problem, you often:",
    options: [
      { text: "Draw a diagram or visualize", style: "video" },
      { text: "Talk through the solution", style: "audio" },
      { text: "Write notes or lists", style: "read_write" },
      { text: "Experiment and manipulate objects", style: "kinesthetic" }
    ]
  }
];

const VARKAssessment = ({ subjectId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const navigate = useNavigate();

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      saveResults(newAnswers);
    }
  };

  const saveResults = async (finalAnswers) => {
    setIsSyncing(true);

    const styles = finalAnswers.map(a => a.style).filter(Boolean);
    const dominantStyle = styles.sort((a, b) =>
      styles.filter(v => v === a).length - styles.filter(v => v === b).length
    ).pop() || 'read_write';

    const dominantSpeed = 'medium';

    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    sessionStorage.setItem('user', JSON.stringify({
      ...storedUser,
      preferred_learning_style: dominantStyle,
      learning_speed: dominantSpeed,
      needs_diagnostic: false
    }));

    try {
      await Promise.race([
        apiClient.post('/auth/diagnostic', { preferred_learning_style: dominantStyle, learning_speed: dominantSpeed }),
        new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000))
      ]);
      console.log('Diagnostic saved successfully');
    } catch (err) {
      console.error('Diagnostic save failed or timed out:', err);
    } finally {
      setIsSyncing(false);
      if (onComplete) onComplete();
    }
  };

  if (isSyncing) return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center space-y-8">
      <div className="w-24 h-24 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
      <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" />
      <p className="text-slate-900 font-black text-xs uppercase tracking-[0.4em] animate-pulse">
        Saving your learning style...
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto px-8 py-20 md:py-40">
      <div className="max-w-4xl mx-auto space-y-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">
              {QUESTIONS[currentStep].text}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {QUESTIONS[currentStep].options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  className="group flex items-center justify-between px-10 py-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-primary-500 hover:shadow-2xl transition-all text-left"
                >
                  <span className="text-xl font-black text-slate-900 tracking-tight relative z-10 group-hover:text-primary-600">
                    {option.text}
                  </span>
                  <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary-600 relative z-10" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VARKAssessment;