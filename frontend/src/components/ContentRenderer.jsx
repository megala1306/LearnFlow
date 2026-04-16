// frontend/components/ContentRenderer.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VisualContent from './VisualContent';
import AudioContent from './AudioContent';
import TextContent from './TextContent';
import InteractiveCoding from './InteractiveCoding';
import { Play, Volume2, FileText, Layers, Sparkles } from 'lucide-react';

// Icons and labels
const MODULE_ICONS = {
  video: <Play className="w-6 h-6" />,
  audio: <Volume2 className="w-6 h-6" />,
  read_write: <FileText className="w-6 h-6" />,
  kinesthetic: <Layers className="w-6 h-6" />
};

const STYLE_LABELS = {
  video: 'Visual',
  audio: 'Audio',
  read_write: 'Read/Write',
  kinesthetic: 'Kinesthetic'
};

// Normalize learning styles
const normalizeStyle = (style) => {
  if (!style) return 'video';
  if (style === 'visual') return 'video';
  if (style === 'auditory') return 'audio';
  if (style === 'read') return 'read_write';
  return style;
};

const ContentRenderer = ({ moduleSections = [], activeType = 'video', onProgressUpdate }) => {
  const [currentType, setCurrentType] = useState(normalizeStyle(activeType));
  const [completed, setCompleted] = useState(false);
  
  // High-Fidelity Time Tracking
  const [timeReport, setTimeReport] = useState({
    video: 0,
    audio: 0,
    read_write: 0,
    kinesthetic: 0
  });

  // Background Timer
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setTimeReport(prev => ({
        ...prev,
        [currentType]: prev[currentType] + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentType, completed]);

  // Sync tab when AI recommendation changes
  useEffect(() => {
    if (activeType) {
      setCurrentType(normalizeStyle(activeType));
    }
  }, [activeType]);

  const section = moduleSections.find(
    (s) => normalizeStyle(s.learningStyle) === currentType
  );
  const contentData = section?.contentData || {};

  useEffect(() => {
    setCompleted(false);
  }, [section?.unitId]);

  const handleComplete = () => {
    if (!completed && onProgressUpdate && section?.unitId) {
      setCompleted(true);
      // Pass the used modality and the detailed time map
      onProgressUpdate(section.unitId, true, 1, currentType, timeReport);
    }
  };

  const renderContent = () => {
    if (!section) {
      return <p>No content available for this style.</p>;
    }

    switch (currentType) {
      case 'video':
        if (contentData.videoUrl) {
          return <VisualContent data={{ title: contentData.title, videoUrl: contentData.videoUrl }} completed={completed} onComplete={handleComplete} />;
        }
        break;

      case 'audio':
        if (contentData.audioUrl) {
          return <AudioContent data={{ title: contentData.title, audioUrl: contentData.audioUrl }} completed={completed} onComplete={handleComplete} />;
        }
        break;

      case 'read_write':
        const notes = contentData.sections || contentData.readwrite_notes || [];
        if (notes.length > 0) {
          return <TextContent data={{ title: contentData.title, sections: Array.isArray(notes) ? notes : [notes] }} onComplete={handleComplete} completed={completed} />;
        }
        break;

      case 'kinesthetic':
        // ALWAYS use InteractiveCoding
        return (
          <InteractiveCoding
            data={{
              title: contentData.title || 'Interactive Lab',
              videoUrl: contentData.videoUrl,
              audioUrl: contentData.audioUrl,
              sections: contentData.sections,
              readwrite_notes: contentData.readwrite_notes,
              prompt: contentData.prompt,
              initialCode: contentData.initialCode,
              expectedOutput: contentData.expectedOutput
            }}
            completed={completed}
            onComplete={handleComplete}
          />
        );

      default:
        return <p>No content available for this learning style.</p>;
    }

    return <p>Content not available for this learning style.</p>;
  };

  return (
    <div className="space-y-10">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(STYLE_LABELS).map((style) => (
          <button
            key={style}
            onClick={() => setCurrentType(style)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all relative ${currentType === style
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-slate-900 border-slate-200 hover:bg-primary-50'
              }`}
          >
            {MODULE_ICONS[style]}
            <span className="text-sm font-black uppercase">{STYLE_LABELS[style]}</span>
            {normalizeStyle(activeType) === style && (
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-bounce shadow-lg">
                REC
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-slate-100"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ContentRenderer;