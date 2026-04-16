import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, XCircle, Zap, ChevronRight, Brain, Sparkles, RotateCcw, Trophy, AlarmClock } from 'lucide-react';
import apiClient from '../api/apiClient';

const LightReview = ({ unitId, onComplete }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('notes'); // 'notes' | 'quiz' | 'results'
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/assessment/light-review/${unitId}`);
        setData(res.data);
      } catch (e) {
        console.error('[LightReview] Failed to load:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [unitId]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-slate-400">Failed to load Light Review session.</div>
  );

  const { notes, questions } = data;
  const currentQuestion = questions[currentQ];
  const score = answers.filter(a => a.isCorrect).length;

  // ---------- PHASE: NOTES ----------
  if (phase === 'notes') return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-[2rem] p-8 flex items-center gap-6">
        <div className="p-4 bg-amber-500 rounded-2xl shadow-lg">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-500 block mb-1">Light Review Mode</span>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Quick Recall Session</h2>
          <p className="text-sm text-slate-500 mt-1">Review the key concepts, then answer 5 targeted questions to reinforce your memory.</p>
        </div>
      </div>

      {/* Read/Write Notes */}
      <div className="space-y-6">
        {notes.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-100 p-8 text-center text-slate-400">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No structured notes available. Proceed to the micro-assessment.</p>
          </div>
        ) : notes.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Note Card Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 flex items-center gap-3">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">#{i + 1}</span>
              <h3 className="text-base font-black text-white uppercase italic tracking-tight">{note.heading}</h3>
            </div>
            {/* Note Content */}
            <div className="px-8 py-6 space-y-4">
              {note.paragraphs?.map((para, j) => (
                <p key={j} className="text-sm text-slate-700 leading-relaxed">{para}</p>
              ))}
              {note.tip && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3 mt-4">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-800 italic">{note.tip}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Proceed to Mini-Quiz */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setPhase('quiz')}
        className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 transition-all"
      >
        <Brain className="w-5 h-5" />
        <span>Start Micro-Assessment ({questions.length} Questions)</span>
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );

  // ---------- PHASE: QUIZ ----------
  if (phase === 'quiz') return (
    <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      {/* Progress */}
      <div className="flex items-center gap-4">
        {questions.map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${
            i < currentQ ? 'bg-amber-500' : i === currentQ ? 'bg-amber-300 animate-pulse' : 'bg-slate-200'
          }`} />
        ))}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Brain className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.5em]">Micro-Assessment • Question {currentQ + 1}</span>
        </div>

        <p className="text-lg font-bold text-slate-900 leading-relaxed">{currentQuestion.question}</p>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options?.map((opt, idx) => {
            let style = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 hover:bg-amber-50';
            if (revealed) {
              if (opt === currentQuestion.correct_answer) style = 'border-green-400 bg-green-50 text-green-800';
              else if (opt === selected) style = 'border-red-400 bg-red-50 text-red-700 line-through';
            } else if (opt === selected) {
              style = 'border-amber-400 bg-amber-50 text-amber-800';
            }
            return (
              <button
                key={idx}
                disabled={revealed}
                onClick={() => { setSelected(opt); }}
                className={`w-full text-left px-6 py-4 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 ${style}`}
              >
                <span className="font-black text-xs mr-3 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation after reveal */}
        <AnimatePresence>
          {revealed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`border rounded-2xl px-6 py-4 ${selected === currentQuestion.correct_answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                 {selected === currentQuestion.correct_answer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-xs font-black text-green-700 uppercase tracking-widest">Correct!</p>
                    </>
                 ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <p className="text-xs font-black text-red-700 uppercase tracking-widest">Incorrect</p>
                    </>
                 )}
              </div>
              
              {selected !== currentQuestion.correct_answer && (
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                      The correct answer is: <span className="font-bold">{currentQuestion.correct_answer}</span>
                  </p>
              )}
              
              {currentQuestion.explanation && (
                  <>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2">Explanation</p>
                     <p className="text-sm text-slate-700 leading-relaxed">{currentQuestion.explanation}</p>
                  </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          {!revealed ? (
            <button
              disabled={!selected}
              onClick={() => setRevealed(true)}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 hover:bg-amber-500 transition-all"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={() => {
                // Record answer
                const isCorrect = selected === currentQuestion.correct_answer;
                const newAnswers = [...answers, { question: currentQuestion.question, selected, isCorrect }];
                setAnswers(newAnswers);
                setSelected(null);
                setRevealed(false);
                if (currentQ + 1 < questions.length) {
                  setCurrentQ(q => q + 1);
                } else {
                  setPhase('results');
                }
              }}
              className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-3"
            >
              {currentQ + 1 < questions.length ? 'Next Question' : 'See Results'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ---------- PHASE: RESULTS ----------
  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
        {/* Score Card */}
        <div className={`rounded-[2rem] p-12 text-center space-y-6 ${passed ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'}`}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-xl ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            {passed ? <Trophy className="w-10 h-10 text-white" /> : <RotateCcw className="w-10 h-10 text-white" />}
          </div>
          <div>
            <p className={`text-6xl font-black ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>{pct}%</p>
            <p className="text-sm font-bold text-slate-500 mt-2">{score} of {questions.length} correct</p>
          </div>
          <div className={`inline-block px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {passed ? '✅ Memory Reinforced' : '⚠️ Review Recommended'}
          </div>
        </div>

        {/* Answer Review */}
        <div className="space-y-3">
          {answers.map((a, i) => (
            <div key={i} className={`flex items-start gap-4 px-6 py-4 rounded-2xl border ${a.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {a.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              <div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{a.question}</p>
                <p className={`text-xs mt-1 ${a.isCorrect ? 'text-green-600' : 'text-red-500'}`}>Your answer: {a.selected}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Complete Button */}
        <button
          onClick={() => onComplete && onComplete({ score: pct / 100, passed, rawAnswers: answers.map(a => a.selected), questions: data.questions })}
          className="w-full py-6 bg-slate-900 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-xl transition-all"
        >
          <Zap className="w-5 h-5" />
          <span>Complete Review Session</span>
        </button>
      </motion.div>
    );
  }

  return null;
};

export default LightReview;
