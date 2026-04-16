import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import ContentRenderer from "./ContentRenderer";

const moduleSectionsTemplate = (unit, xaiExplanation) => [
  {
    learningStyle: "video",
    contentData: {
      title: "Animated Concepts",
      videoUrl: unit.visual_video_url || unit.video_url || null,
      description: unit.video_script || "",
      explanation: xaiExplanation || unit.explanation || null // XAI Insight
    },
    unitId: unit._id,
  },
  {
    learningStyle: "audio",
    contentData: {
      title: "Audio Insights",
      audioUrl: unit.auditory_audio_url
        ? unit.auditory_audio_url.startsWith("http")
          ? unit.auditory_audio_url
          : `http://localhost:5000${unit.auditory_audio_url}`
        : null,
      transcript: unit.auditory_transcript || unit.content_text || "",
      explanation: xaiExplanation || unit.explanation || null // XAI Insight
    },
    unitId: unit._id,
  },
  {
    learningStyle: "read_write",
    contentData: {
      title: "Deep Dive Notes",
      sections: (() => {
        // Get notes from unit
        const rawNotes = unit.readwrite_notes || [];
        const notesArray = Array.isArray(rawNotes) ? rawNotes : [rawNotes];

        return notesArray.map(note => {
          // Ensure we have a string for split in TextContent or direct paragraphs
          return {
            ...note,
            heading: note.heading || "Concept Overview",
            paragraphs: note.paragraphs && Array.isArray(note.paragraphs) ? note.paragraphs : (note.text ? [note.text] : []),
            text: note.text || (Array.isArray(note.paragraphs) ? note.paragraphs.join('\n\n') : ""),
            tip: note.tip || null
          };
        });
      })(),
      explanation: xaiExplanation || unit.explanation || null // XAI Insight
    },
    unitId: unit._id,
  },
  {
    learningStyle: "kinesthetic",
    contentData: {
      title: "Interactive Lab",
      prompt: unit.kinesthetic_prompt || null,
      initialCode: unit.kinesthetic_initial_code || "",
      expectedOutput: unit.kinesthetic_expected_output || "",
      videoUrl: unit.visual_video_url || unit.video_url || null,
      explanation: xaiExplanation || unit.explanation || null // XAI Insight
    },
    unitId: unit._id,
  }
];

const AdaptiveUnit = ({ unit, activeType, onProgressUpdate, isSwitching, user, explanation }) => {
  const [recommendedType, setRecommendedType] = useState(activeType || "video");

  useEffect(() => {
    setRecommendedType(activeType || "video");
  }, [unit?._id, activeType]);

  if (unit?.isApproved === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
        <Shield className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">
          Content Pending Approval
        </h3>
        <p className="text-slate-400 text-sm font-medium mt-2">
          This learning module is currently being reviewed by the curriculum board.
        </p>
      </div>
    );
  }

  const allSections = moduleSectionsTemplate(unit, explanation);

  return (
    <div className="space-y-32 pb-40 selection:bg-primary-500/10 relative">
      {/* ---------------- Preferred Learning Type Box (Right Corner) ---------------- */}
      {user?.preferred_learning_style && (
        <div className="fixed top-24 right-10 px-6 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl z-[150] flex items-center space-x-3 border border-white/10 backdrop-blur-xl">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping" />
          <span>Preference: {user.preferred_learning_style.replace('_', ' ')}</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <AnimatePresence mode="wait">
          {isSwitching ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col justify-center items-center py-60 space-y-6"
            >
              <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Reconfiguring Stream...</p>
            </motion.div>
          ) : (
            <motion.div
              key={unit._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ContentRenderer
                moduleSections={allSections}
                activeType={recommendedType}
                onProgressUpdate={onProgressUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AdaptiveUnit;