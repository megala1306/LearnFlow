// frontend/components/TextContent.jsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2pdf from 'html2pdf.js';
import { Download, CheckCircle, Lightbulb, BookOpen } from 'lucide-react';

// Enhanced technical keyword mapping with definitions
const KEY_DEFINITIONS = {
  'PEP 8': 'The official Style Guide for Python Code, ensuring readability and consistency across all projects.',
  'INDENTATION ERROR': 'A syntax error occurring when whitespace levels do not align with Python logic blocks—Python requires 4 spaces.',
  'DYNAMIC TYPING': 'A memory system where variable types are determined at runtime, not fixed in advance.',
  'D.R.Y': "Stands for 'Don't Repeat Yourself'—the core principle of modular, reusable, and efficient programming.",
  'MUTABLE': 'Objects (like lists) that can be changed in-place without creating a new memory identity.',
  'IMMUTABLE': 'Objects (like strings or tuples) that cannot be changed once created; any "change" creates a new object.',
  'MEMORY IDENTITY': 'The unique address (ID) where an object is stored in your computer RAM—check it using id().',
  'O(1)': 'Constant time complexity—the fastest possible data retrieval speed, used in Dictionaries and Sets.',
  'DECORATOR': 'A design pattern (@syntax) that allows you to wrap another function to extend its behavior without changing its code.',
  'LIST COMPREHENSION': 'A concise, high-performance way to create lists using a single line of logic.',
  'CLOSURE': 'A powerful functional pattern where a nested function "remembers" variables from its outer scope.',
  'GENERATOR': 'A memory-efficient iterator that produces items one-at-a-time (lazy evaluation) instead of storing them all in RAM.',
  'HASH TABLE': 'The internal data structure driving Dictionaries and Sets, providing near-instant lookups.'
};

const TechnicalTerm = ({ term }) => (
  <span className="group relative inline-block">
    <span className="cursor-help border-b-2 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50 px-1 rounded transition-all">
      {term}
    </span>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-slate-900/95 backdrop-blur-xl text-white text-[11px] font-medium rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[999] leading-relaxed border border-white/10">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-1 h-3 bg-indigo-500 rounded-full" />
        <span className="block text-indigo-400 font-black uppercase tracking-[0.2em] transform-gpu">Glossary / Concept</span>
      </div>
      {KEY_DEFINITIONS[term.toUpperCase()] || 'Fundamental Python concept.'}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900/95" />
    </span>
  </span>
);

const TechnicalHighlighter = ({ text }) => {
  if (!text || typeof text !== 'string') return text;
  
  const keywords = Object.keys(KEY_DEFINITIONS);
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.filter(part => part !== undefined).map((part, i) => {
        const isMatch = part && keywords.includes(part.toUpperCase());
        return isMatch ? <TechnicalTerm key={i} term={part} /> : part;
      })}
    </>
  );
};
const TextContent = ({ data, onComplete, completed }) => {
  const notesRef = useRef();
  const [readingProgress, setReadingProgress] = React.useState(0);
  const containerRef = useRef(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const element = containerRef.current;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const windowScrollTop = element.scrollTop;
      if (totalHeight === 0) return setReadingProgress(100);
      setReadingProgress((windowScrollTop / totalHeight) * 100);
    };

    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentRef) currentRef.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <BookOpen className="w-12 h-12 mb-4 opacity-20" />
      <p className="font-medium">No notation material available for this module.</p>
    </div>
  );

  // Robust flipping logic to ensure ALL content is captured
  const notesArray = [];
  if (data.sections && Array.isArray(data.sections)) {
    notesArray.push(...data.sections);
  } else if (data.readwrite_notes) {
    const rwn = data.readwrite_notes;
    if (rwn.sections && Array.isArray(rwn.sections)) {
      notesArray.push(...rwn.sections);
    } else if (Array.isArray(rwn)) {
      notesArray.push(...rwn);
    } else if (rwn.paragraphs || rwn.text || rwn.content) {
      notesArray.push(rwn);
    }
  }

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!notesRef.current) return;

    try {
      // Use standard alert for immediate feedback
      console.log("Generating PDF...");
      
      const opt = {
        margin: [0.5, 0.5], // Smaller margins for cleaner mobile feel
        filename: `LearnFlow_${data.title?.replace(/\s+/g, '_') || 'Lesson'}_Notes.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, // Scale 2 is safer for mobile performance
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Show alert so user knows it started
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        alert("Preparing your study materials... Download will start in a moment.");
      }

      await html2pdf().set(opt).from(notesRef.current).save();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Note: PDF generation encountered an issue. Please try again or check permissions.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 relative">
      {/* Sticky Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-[100]">
        <motion.div 
          className="h-full bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Sidebar: Table of Contents */}
      <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-32 h-fit space-y-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Syllabus Index</span>
          </div>
          <nav className="space-y-2 border-l border-slate-100 pl-4">
            {notesArray.map((note, idx) => (
              <a 
                key={idx}
                href={`#section-${idx}`}
                className="block text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-widest py-1"
              >
                0{idx + 1} {note.heading?.split(':').pop().trim() || "Unit"}
              </a>
            ))}
          </nav>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reading Density</span>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 w-3/4 rounded-full" />
          </div>
          <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">Estimated reading time: {Math.ceil(notesArray.length * 1.5)} minutes of deep technical study.</p>
        </div>
      </aside>

      <div 
        ref={containerRef}
        className="flex-1 space-y-12 overflow-y-auto max-h-[85vh] pr-4 pt-24 pb-32 scroll-smooth scrollbar-hide"
      >
        {/* Premium Header Container */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-10 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-primary-600">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Comprehensive Notation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight italic uppercase leading-none">
              {data.title || "Subject Syllabus"}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="group flex items-center space-x-2 px-6 py-3 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span className="text-xs uppercase tracking-widest">Store PDF</span>
            </button>

            {!completed && onComplete && (
              <button
                onClick={onComplete}
                className="flex items-center space-x-3 px-8 py-3 bg-primary-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-95 group"
              >
                <span>Synchronize Node</span>
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>

      {/* Main Content Area */}
      <div ref={notesRef} className="space-y-16 selection:bg-primary-100">
        {notesArray.length > 0 ? (
          notesArray.map((note, idx) => {
            if (!note) return null;

            // Handle various paragraph source formats
            const paragraphsArray = note.paragraphs && Array.isArray(note.paragraphs)
              ? note.paragraphs
              : note.text
                ? note.text.split('\n\n')
                : note.content
                  ? note.content.split('\n\n')
                  : [];

            return (
              <motion.div
                key={idx}
                id={`section-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-8 scroll-mt-32"
              >
                {/* Section Branding */}
                {note.heading && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-primary-200 uppercase tracking-widest">Component 0{idx + 1}</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic border-l-4 border-primary-600 pl-6">
                      {note.heading}
                    </h3>
                  </div>
                )}

                {/* Paragraph Content Rendering */}
                <div className="space-y-6 text-slate-700 leading-[1.8] font-medium text-lg">
                  {paragraphsArray.map((para, j) => {
                    // Check for code blocks within paragraphs
                    // Robust regex for Markdown-style triple backtick code blocks
                    const splitByCode = para.split(/(```python[\s\S]*?```)/g);
                    return splitByCode.map((chunk, i) => {
                      if (chunk.startsWith('```python')) {
                        // Extract actual code (remove the ```python and ```)
                        const code = chunk.replace(/^```python\n?/, '').replace(/```$/, '').trim();
                        return (
                          <div key={`${j}-${i}`} className="my-10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-slate-100 bg-slate-900">
                            <div className="px-6 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal Output</span>
                              <div className="flex space-x-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-400/50" />
                                <div className="w-2 h-2 rounded-full bg-yellow-400/50" />
                                <div className="w-2 h-2 rounded-full bg-green-400/50" />
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <SyntaxHighlighter
                                language="python"
                                style={oneDark}
                                wrapLongLines={false}
                                customStyle={{
                                  margin: 0,
                                  padding: '2rem',
                                  background: 'transparent',
                                  fontSize: '0.9rem',
                                  lineHeight: '1.7',
                                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                                }}
                              >
                                {code}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        );
                      } else if (chunk.trim()) {
                        // Standard text chunk
                        return (
                          <p
                            key={`${j}-${i}-text`}
                            className="text-slate-800 hover:text-indigo-900 transition-colors"
                          >
                            <TechnicalHighlighter text={chunk} />
                          </p>
                        );
                      }
                      return null;
                    });
                  })}
                </div>

                {/* Contextual Intelligence Insight (Tips) */}
                {note.tip && (
                  <div className="p-10 bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] flex items-start space-x-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50 flex-shrink-0 relative z-10">
                      <Lightbulb className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Synaptic Shortcut</span>
                      <p className="text-indigo-900/80 font-bold leading-relaxed">{note.tip}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic tracking-tighter uppercase text-xl">Defragmenting Data Stream...</p>
            <p className="text-slate-400 text-sm mt-2">The full notations are being compiled by the cognitive engine.</p>
          </div>
        )}
        
        {/* Bottom Completion Button */}
        <div className="pt-10 pb-32 flex justify-end">
          <button
            onClick={onComplete}
            disabled={completed}
            className={`flex items-center gap-2 font-bold py-4 px-8 rounded-2xl transition-all active:scale-95 shadow-xl ${
              completed
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/20'
            }`}
          >
            <span>{completed ? 'Module Completed' : 'Synchronize Node (Complete)'}</span>
            {!completed && <CheckCircle className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default TextContent;