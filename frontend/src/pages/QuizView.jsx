import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Trophy, Target, Sparkles, Cpu, ArrowLeft, Zap, Layers, Activity, MousePointer2, Clock, Tag, Terminal, BookOpen } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const QuizView = () => {
    const { unitId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser } = useAuth();
    
    // Activity Metadata from LessonView
    const modality = location.state?.modality;
    const timeSpentMap = location.state?.timeSpentMap;
    
    // Core State
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [unit, setUnit] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [direction, setDirection] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    
    // Rich Metadata
    const [meta, setMeta] = useState({
        estimatedTime: "5 - 10 Mins",
        moduleCategory: "Cognitive Mastery",
        protocolLabel: "SYNC-CORE-01"
    });

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await apiClient.get(`/assessment/${unitId}`);
                setQuestions(res.data.questions || []);
                setMeta({
                    estimatedTime: res.data.estimatedTime || "5 Mins",
                    moduleCategory: res.data.moduleCategory || "General Mastery",
                    protocolLabel: res.data.protocolLabel || "SYNC-7X-Baseline"
                });
                
                const unitRes = await apiClient.get(`/units`);
                const currentUnit = unitRes.data.find(u => u._id === unitId);
                setUnit(currentUnit);
            } catch (err) {
                console.error("Failed to load quiz:", err);
                setError(err.response?.data?.message || "Failed to load cognitive assessment.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [unitId]);

    const handleSelect = (option) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentStep]: option });
        if (currentStep < questions.length - 1) {
            setTimeout(() => {
                setDirection(1);
                setCurrentStep(prev => prev + 1);
            }, 600);
        }
    };

    const nextStep = () => {
        if (currentStep < questions.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user || !user._id) {
            setError("User session invalid. Please log in again.");
            return;
        }
        if (Object.keys(answers).length < questions.length) {
            setError(`Please answer all ${questions.length} questions before submitting.`);
            return;
        }
        
        try {
            setSubmitting(true);
            const orderedAnswers = questions.map((_, idx) => answers[idx]);
            
            console.log("[QUIZ-DEBUG] Payload:", { unitId, orderedAnswers, questionsCount: questions.length, modality, timeSpentMap });
            
            const res = await apiClient.post('/assessment/submit', {
                unitId: unitId, 
                answers: orderedAnswers, 
                questions: questions,
                modality: modality,
                time_spent: timeSpentMap
            });
            console.log("[QUIZ-DEBUG] Submission Success:", res.data);
            setResult(res.data);
            setSubmitted(true);
            if (refreshUser) await refreshUser();
        } catch (err) {
            console.error("[QUIZ-DEBUG] Submission failed:", err);
            const msg = err.response?.data?.message || err.message;
            setError("Synchronization failed: " + msg);
        } finally {
            setSubmitting(false);
        }
    };

    const NeuralBlobs = () => (
        <div className="fixed inset-0 pointer-events-none z-0">
            <motion.div
                animate={{ x: [0, 80, -40], y: [0, -40, 80], scale: [1, 1.1, 0.95] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-5%] left-[-2%] w-[500px] h-[500px] bg-emerald-100/40 blur-[100px] rounded-full"
            />
            <motion.div
                animate={{ x: [0, -100, 60], y: [0, 80, -40] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-5%] right-[-2%] w-[600px] h-[600px] bg-teal-100/40 blur-[120px] rounded-full"
            />
        </div>
    );

    if (error) {
        return (
            <div className="min-h-screen bg-[#f7f9fa] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <NeuralBlobs />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative z-10 w-24 h-24 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center shadow-xl">
                    <XCircle className="w-12 h-12 text-rose-500" />
                </motion.div>
                <div className="space-y-4 relative z-10 mt-8">
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none bg-gradient-to-r from-slate-900 to-rose-600 bg-clip-text text-transparent">Assessment Restricted</h2>
                    <p className="text-slate-500 font-bold max-w-md mx-auto uppercase text-[11px] tracking-widest">{error}</p>
                </div>
                <button onClick={() => navigate(-1)} className="mt-12 relative z-10 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                    Return to Fleet Hub
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f9fa] flex flex-col items-center justify-center relative overflow-hidden">
                <NeuralBlobs />
                <div className="relative z-10 text-center">
                    <div className="w-32 h-32 mx-auto border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin flex items-center justify-center">
                        <Brain className="w-12 h-12 text-emerald-600 animate-pulse" />
                    </div>
                    <p className="mt-8 text-emerald-600/60 font-black text-[10px] uppercase tracking-[0.8em] animate-pulse">
                        Synchronizing Neural Link...
                    </p>
                </div>
            </div>
        );
    }

    if (submitted && result) {
        const passed = result.recommendation === "next_lesson" || result.recommendation === "course_complete";
        return (
            <div className="min-h-screen bg-[#f7f9fa] py-20 px-6 sm:px-12 selection:bg-emerald-100 relative overflow-y-auto">
                <NeuralBlobs />
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10 relative z-10 font-sans">
                    <div className={`backdrop-blur-3xl border shadow-2xl rounded-[3rem] p-12 text-center overflow-hidden relative ${passed ? 'bg-emerald-50/60 border-emerald-100' : 'bg-rose-50/60 border-rose-100'}`}>
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 relative ${passed ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-500/10' : 'bg-white text-rose-600 shadow-xl shadow-rose-500/10'}`}>
                            {passed ? <Trophy className="w-12 h-12" /> : <Zap className="w-12 h-12" />}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-6">
                            <span className="bg-gradient-to-r from-slate-900 via-emerald-700 to-teal-600 bg-clip-text text-transparent">
                                {passed ? "Mastery Confirmed" : "Reinforcement Required"}
                            </span>
                        </h1>
                        <p className={`text-[10px] font-black uppercase tracking-[0.5em] mb-12 ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            SYNC Integrity Index: {(result.accuracy * 100).toFixed(0)}%
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] border border-white flex flex-col items-center group transition-all duration-500 hover:shadow-lg">
                                <Target className="w-6 h-6 text-slate-400 mb-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">Accuracy Level</span>
                                <h3 className="text-3xl font-black text-slate-900 mt-2 leading-none">{result.score}/{questions.length}</h3>
                            </div>
                            <div className="bg-emerald-50/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-emerald-100 flex flex-col items-center group transition-all duration-500 hover:shadow-lg hover:bg-white">
                                <Sparkles className="w-6 h-6 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 leading-none">Knowledge XP Gained</span>
                                <h3 className="text-3xl font-black text-emerald-600 mt-2 leading-none">+{passed ? 50 : 20}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between space-x-6 mb-8 px-6">
                            <div className="flex items-center space-x-6">
                                <Activity className="w-5 h-5 text-slate-300" />
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Neural Analysis Output</h3>
                            </div>
                            <button onClick={() => navigate(`/lesson/${unit?.lessonId}`)} className="flex items-center space-x-3 text-slate-900 font-black uppercase text-[9px] tracking-[0.4em] hover:text-emerald-600 transition-all border-b border-emerald-100 pb-1">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Re-access Content</span>
                            </button>
                        </div>
                        {result.results?.map((res, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className={`group backdrop-blur-3xl rounded-[3rem] p-10 border shadow-sm transition-all duration-500 hover:shadow-xl relative overflow-hidden ${res.isCorrect ? 'bg-white/70 border-emerald-100' : 'bg-white/70 border-rose-100'}`}>
                                <div className={`absolute top-0 left-0 w-2 h-full ${res.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <div className="flex items-start justify-between gap-8 mb-8 relative z-10">
                                    <h4 className="text-xl font-bold font-sans text-slate-900 tracking-tight leading-tight uppercase italic">{res.question}</h4>
                                    {res.isCorrect ? <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div> : <div className="p-2 bg-rose-50 rounded-xl"><XCircle className="w-6 h-6 text-rose-500" /></div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className={`p-6 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${res.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                        <span className="opacity-50">User Protocol:</span>
                                        <span className="text-right">{res.selectedAnswer}</span>
                                    </div>
                                    {!res.isCorrect && (
                                        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest flex items-center justify-between text-slate-500">
                                            <span className="opacity-50">Mastery Vector:</span>
                                            <span className="text-right text-slate-900">{res.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-50 flex items-start space-x-6">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm"><Brain className="w-5 h-5 text-emerald-500" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-1.5 leading-none">Neural Explanation</p>
                                        <p className="text-slate-600 text-sm font-bold leading-relaxed">{res.explanation}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col space-y-6 pt-16">
                        {passed ? (
                            <button onClick={() => result.nextLessonId ? navigate(`/lesson/${result.nextLessonId}`) : navigate('/dashboard')} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-4 group">
                                <span>Advance System Link</span>
                                <ChevronRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                            </button>
                        ) : (
                            <div className="flex flex-col space-y-4 w-full">
                                <button onClick={() => navigate(`/lesson/${unit?.lessonId}`)} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-4 group">
                                    <span>Return to Lesson (Relearn)</span>
                                    <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all">
                                    <span>Retry Cognitive Sync</span>
                                </button>
                            </div>
                        )}
                        <button onClick={() => navigate('/dashboard')} className="w-full py-4 text-slate-400 font-bold uppercase text-[9px] tracking-[0.5em] hover:text-slate-900 transition-colors duration-500">Return to Fleet Dashboard</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentQ = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-[#f7f9fa] selection:bg-emerald-100 relative overflow-hidden flex flex-col font-sans">
            <NeuralBlobs />
            <header className="relative w-full z-50 px-10 pt-16 pb-10 pointer-events-none">
                <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center space-x-6 backdrop-blur-xl bg-white/70 px-8 py-5 rounded-[2.5rem] border border-white shadow-2xl">
                        <div className="p-3 bg-slate-900 rounded-2xl shadow-lg"><Brain className="w-5 h-5 text-white" /></div>
                        <div>
                            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] leading-none mb-1.5">Cognitive Synchronization</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{unit?.title || "Neural Module Loop"}</p>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center space-x-4">
                        <div className="backdrop-blur-xl bg-teal-50/60 px-6 py-4 rounded-[2rem] border border-teal-100 flex items-center space-x-3 shadow-lg">
                            <Clock className="w-4 h-4 text-teal-600" />
                            <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">{meta.estimatedTime}</span>
                        </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/70 px-8 py-5 rounded-[2.5rem] border border-white shadow-2xl flex flex-col items-end">
                        <div className="flex items-center space-x-3 mb-1.5">
                             <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-md animate-pulse" />
                             <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] leading-none">Neural Link</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{progress.toFixed(0)}% Stabilized</span>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: "circOut" }} className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
                </div>
            </header>

            <main className="flex-1 container max-w-4xl mx-auto pt-16 pb-24 px-8 flex flex-col relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: direction * 80, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -direction * 80, filter: 'blur(10px)' }} transition={{ duration: 0.6, ease: "circOut" }} className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-center space-x-8 mb-16 px-6">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                            <div className="flex flex-col items-center space-y-2 shrink-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none">Probe Protocol {currentStep + 1}</span>
                                <div className="flex space-x-2">
                                    {questions.map((_, idx) => (
                                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-10 bg-emerald-600' : idx < currentStep ? 'w-3 bg-emerald-200' : 'w-3 bg-slate-100'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-black leading-[1.15] tracking-tighter uppercase italic py-8 text-center">
                             <span className="bg-gradient-to-br from-slate-900 via-emerald-700 to-teal-600 bg-clip-text text-transparent">{currentQ?.question}</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-5 mt-10 max-w-3xl mx-auto w-full">
                            {currentQ?.options?.map((opt, idx) => (
                                <motion.button key={idx} whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(opt)} className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-lg ${answers[currentStep] === opt ? 'border-emerald-600 bg-white ring-4 ring-emerald-500/5' : 'border-white bg-white/80 backdrop-blur-3xl hover:border-slate-200'}`}>
                                    <div className="flex items-center space-x-8 z-10">
                                        <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center text-[10px] font-black transition-all ${answers[currentStep] === opt ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>{String.fromCharCode(65 + idx)}</div>
                                        <span className={`text-base font-bold tracking-tight uppercase transition-colors duration-500 ${answers[currentStep] === opt ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>{opt}</span>
                                    </div>
                                    {answers[currentStep] === opt ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10 bg-emerald-600 rounded-full p-0.5 shadow-md"><CheckCircle2 className="w-5 h-5 text-white" /></motion.div> : <MousePointer2 className="w-4 h-4 text-slate-200 group-hover:text-slate-400 opacity-0 group-hover:opacity-100" />}
                                    {answers[currentStep] === opt && <div className="absolute inset-0 bg-emerald-50/30 z-0" />}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
                <div className="mt-auto pt-20 flex items-center justify-between">
                    <div className="flex flex-col space-y-4">
                        <button onClick={prevStep} disabled={currentStep === 0} className="flex items-center space-x-3 text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] hover:text-slate-900 transition-all duration-500 disabled:opacity-0 group">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Navigate Back</span>
                        </button>
                        <button onClick={() => navigate(`/lesson/${unit?.lessonId}`)} className="flex items-center space-x-3 text-slate-400 font-black uppercase text-[9px] tracking-[0.3em] hover:text-emerald-600 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                            <span>Exit to Lesson</span>
                        </button>
                    </div>
                    {currentStep === questions.length - 1 ? (
                        <button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length || submitting} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 disabled:opacity-30">
                            <span>{submitting ? 'Synchronizing Link...' : 'Synchronize Link'}</span>
                            <Zap className={`w-5 h-5 ${submitting ? 'animate-spin' : 'animate-pulse'}`} />
                        </button>
                    ) : (
                        <button onClick={nextStep} disabled={!answers[currentStep]} className="flex items-center space-x-3 text-slate-900 font-black uppercase text-[10px] tracking-[0.4em] hover:text-emerald-600 transition-all duration-500 disabled:opacity-20 group">
                            <span>Next Protocol</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuizView;
