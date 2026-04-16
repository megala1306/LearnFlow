import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Trophy, Cpu, Zap, Layers, Brain, CheckCircle2, MessageSquare, Send, X, Bot, AlertTriangle, Shield, Info, Activity, MousePointer2, Clock, ShieldCheck, Sparkles, LayoutDashboard, BookOpen } from 'lucide-react';
import apiClient from '../api/apiClient';
import AdaptiveUnit from '../components/AdaptiveUnit';
import LightReview from '../components/LightReview';
import { useAuth } from '../context/AuthContext';

const LessonView = () => {
    const { id: lessonId } = useParams();
    const { user, loading: userLoading, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Core Parameters
    const repairMode = location.state?.mode === 'repair';
    const reviewType = location.state?.reviewType;
    const weakTopics = location.state?.weakTopics || [];
    const targetUnitId = location.state?.unitId;

    // State Layer
    const [lesson, setLesson] = useState(null);
    const [units, setUnits] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAssessmentButton, setShowAssessmentButton] = useState(false);
    const [currentComplexity, setCurrentComplexity] = useState('easy');
    const [error, setError] = useState(null);
    const [xaiReport, setXaiReport] = useState(null);
    const [recommendedModality, setRecommendedModality] = useState(null);
    const [timeSpent, setTimeSpent] = useState(0);

    // High-Fidelity Activity Tracking (Synchronous Vault)
    const sessionReportRef = useRef({ modality: null, timeSpentMap: null });

    useEffect(() => {
        const timer = setInterval(() => setTimeSpent(p => p + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchLessonData = async () => {
            try {
                setLoading(true);
                setError(null);
                const lessonRes = await apiClient.get(`/lessons/${lessonId}`);
                setLesson(lessonRes.data);
                const unitsRes = await apiClient.get(`/lessons/${lessonId}/units`);
                const allUnits = unitsRes.data.units || [];
                setUnits(allUnits);

                if (allUnits.length === 0) throw new Error("No cognitive nodes available.");

                try {
                    const recRes = await apiClient.get(`/units/recommend/${lessonId}`);
                    const { recommended_complexity, recommended_modality, xai_report } = recRes.data;
                    setCurrentComplexity(recommended_complexity);
                    setRecommendedModality(recommended_modality);
                    setXaiReport(xai_report);
                    const unitIdx = targetUnitId ? allUnits.findIndex(u => u._id === targetUnitId) : allUnits.findIndex(u => u.complexity === recommended_complexity);
                    if (unitIdx !== -1) setCurrentIndex(unitIdx);
                } catch (recError) {
                    setRecommendedModality(user?.preferred_learning_style || 'video');
                    setXaiReport({ status: 'initial', label: 'Neural Startup', explanation: 'The AI engine is calibrating your mastery path.', color: 'emerald' });
                    const unitIdx = allUnits.findIndex(u => u.complexity === 'easy');
                    if (unitIdx !== -1) setCurrentIndex(unitIdx);
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLessonData();
    }, [lessonId, targetUnitId]);

    const handleComplete = (unitId, status, accuracy, modality, timeMap) => {
        console.log(`[SYNC-DEBUG] Lesson Complete: modality=${modality}, time=${JSON.stringify(timeMap)}`);
        sessionReportRef.current = { modality, timeSpentMap: timeMap };
        setShowAssessmentButton(true);
    };

    const NeuralBlobs = () => (
        <div className="fixed inset-0 pointer-events-none z-0">
            <motion.div animate={{ x: [0, 80, -40], y: [0, -40, 80], scale: [1, 1.1, 0.95] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[-5%] left-[-2%] w-[500px] h-[500px] bg-emerald-100/30 blur-[100px] rounded-full" />
            <motion.div animate={{ x: [0, -100, 60], y: [0, 80, -40] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-5%] right-[-2%] w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full" />
        </div>
    );

    if (loading || userLoading) {
        return (
            <div className="min-h-screen bg-[#f7f9fa] flex flex-col items-center justify-center relative overflow-hidden text-center">
                <NeuralBlobs />
                <div className="relative z-10 w-32 h-32 mx-auto border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin flex items-center justify-center">
                    <Brain className="w-12 h-12 text-emerald-600 animate-pulse" />
                </div>
                <p className="mt-8 text-emerald-600/60 font-black text-xs uppercase tracking-[0.8em] animate-pulse">Synchronizing Link...</p>
            </div>
        );
    }

    // Guard against empty units to prevent crash
    if (!loading && !userLoading && units.length === 0) {
        return (
            <div className="min-h-screen bg-[#f7f9fa] flex flex-col items-center justify-center p-8 text-center">
                <NeuralBlobs />
                <div className="relative z-10 space-y-6">
                    <Shield className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic">Awaiting Admin Approval</h2>
                    <p className="text-slate-500 max-w-md mx-auto">The cognitive nodes for this module are staged but require neural validation from an administrator before synchronization.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button onClick={() => navigate('/courses')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Back to Fleet</button>
                        <button onClick={() => navigate(lesson?.subject ? `/syllabus/${lesson.subject._id || lesson.subject}` : '/dashboard')} className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Return to Syntax</button>
                    </div>
                </div>
            </div>
        );
    }

    const currentUnit = units[currentIndex];

    return (
        <div className="min-h-screen bg-[#f7f9fa] pb-32 relative overflow-x-hidden selection:bg-emerald-100 font-sans">
            <NeuralBlobs />
            <nav className="fixed top-8 left-8 right-8 z-[1000] h-20">
                <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-10 bg-white/70 backdrop-blur-3xl border border-white shadow-2xl rounded-full">
                    
                    {/* Logo and Core Navigation Links */}
                    <div className="flex items-center space-x-12">
                        <div onClick={() => navigate('/dashboard')} className="flex items-center space-x-3 cursor-pointer group">
                            <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-emerald-600 transition-all duration-300 shadow-lg"><Zap className="w-5 h-5 text-white" /></div>
                            <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">LearnFlow</h2>
                        </div>
                        
                        {/* THE MISSING NAVIGATION LINKS */}
                        <div className="hidden lg:flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                             <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-3 hover:text-emerald-600 transition-colors group">
                                <LayoutDashboard className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                <span>Dashboard</span>
                             </button>
                             <button onClick={() => navigate('/courses')} className="flex items-center space-x-3 hover:text-emerald-600 transition-colors group">
                                <BookOpen className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                <span>Curriculum</span>
                             </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-8">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{user?.name}</p>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Adaptive Connection</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex items-center space-x-3 bg-slate-100/50 px-5 py-2.5 rounded-full border border-slate-100">
                            <Activity className={`w-3.5 h-3.5 ${currentComplexity === 'easy' ? 'text-emerald-500' : currentComplexity === 'medium' ? 'text-amber-500' : 'text-rose-500'}`} />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{currentComplexity}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <header className="pt-48 pb-10 px-8 relative z-10 text-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div className="space-y-4">
                            <button onClick={() => navigate(lesson?.subject ? `/syllabus/${lesson.subject._id || lesson.subject}` : '/dashboard')} className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] hover:opacity-60 transition-all group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span>Return Command</span>
                            </button>
                            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-[0.95]">
                                <span className="bg-gradient-to-r from-slate-900 via-emerald-700 to-teal-500 bg-clip-text text-transparent">{lesson?.title}</span>
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="backdrop-blur-xl bg-emerald-50/60 px-6 py-4 rounded-[1.5rem] border border-emerald-100 flex items-center space-x-3 shadow-sm">
                                <Cpu className="w-4 h-4 text-emerald-600" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Neural Calibration</span>
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-1 italic">{xaiReport?.label || "Probing..."}</span>
                                </div>
                            </div>
                            <div className="backdrop-blur-xl bg-teal-50/60 px-6 py-4 rounded-[1.5rem] border border-teal-100 flex items-center space-x-3 shadow-sm">
                                <Sparkles className="w-4 h-4 text-teal-600" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest leading-none">Recommended</span>
                                    <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest mt-1">{recommendedModality} Sync</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-8 mt-12 max-w-7xl mx-auto space-y-16 relative z-10">
                <div className="space-y-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-3xl border border-white shadow-xl rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-emerald-600 to-teal-500" />
                        <div className="p-3 bg-slate-900 rounded-2xl shadow-xl"><ShieldCheck className="w-6 h-6 text-white" /></div>
                        <div className="flex-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 leading-none">Active Insight Stream</p>
                             <p className="text-sm font-bold text-slate-600 leading-relaxed italic pr-6 group">"{xaiReport?.explanation}"</p>
                        </div>
                        <div className="shrink-0 flex items-center space-x-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Buffer Sync: {timeSpent}s</span>
                        </div>
                    </motion.div>
                    <div className="max-w-5xl mx-auto w-full transition-all duration-700">
                        {reviewType === 'light_review' ? (
                            <LightReview
                                unitId={currentUnit?._id}
                                onComplete={async ({ score, passed, rawAnswers, questions }) => {
                                    try {
                                        await apiClient.post('/assessment/submit', {
                                            unitId: currentUnit._id,
                                            answers: rawAnswers,
                                            questions: questions,
                                            modality: 'read_write',
                                            time_spent: { read_write: 60 }
                                        });
                                    } catch (err) {
                                        console.error('Failed to sync light review score:', err);
                                    }
                                    navigate('/dashboard');
                                }}
                            />
                        ) : (
                            <AdaptiveUnit
                                unit={currentUnit} activeType={recommendedModality} explanation={xaiReport?.explanation} onProgressUpdate={handleComplete} user={user}
                                onComplexityChange={(prev, next) => {
                                    const foundIdx = units.findIndex(u => u.complexity === next);
                                    if (foundIdx !== -1) { setCurrentIndex(foundIdx); setCurrentComplexity(next); setShowAssessmentButton(false); }
                                }}
                            />
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showAssessmentButton && (
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 rounded-[4rem] p-16 md:p-24 shadow-2xl shadow-emerald-600/30 text-center space-y-12 relative overflow-hidden" >
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-emerald-600 to-teal-500" />
                            <div className="relative z-10 w-20 h-20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center mx-auto ring-8 ring-white/5"><Brain className="w-10 h-10 text-emerald-400 animate-pulse" /></div>
                            <div className="space-y-6 max-w-3xl mx-auto relative z-10">
                                <span className="inline-block px-5 py-2 bg-emerald-600/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.45em] border border-emerald-500/10">Final Sync Matrix</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Mastery Sync Request</h2>
                                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto opacity-70">Technical data ingested. Ready to synchronize current session weights into your permanent retention memory.</p>
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 pt-4">
                                <button onClick={() => { if (timeSpent < 60) { alert(`Buffer Syncing: ${60 - timeSpent}s remaining.`); return; } navigate(`/assessment/${currentUnit._id}`, { state: { modality: sessionReportRef.current.modality, timeSpentMap: sessionReportRef.current.timeSpentMap } }); }} className={`px-16 py-7 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center space-x-6 transition-all shadow-2xl active:scale-95 group ${timeSpent < 60 ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.03] shadow-emerald-600/30'}`}>
                                    <span>{timeSpent < 60 ? `Buffer Loading (${60 - timeSpent}s)` : 'Initialize Sync'}</span>
                                    <Zap className={`w-6 h-6 ${timeSpent >= 60 ? 'animate-bounce' : ''}`} />
                                </button>
                                <button onClick={() => setShowAssessmentButton(false)} className="px-10 py-7 bg-white/5 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all border border-white/10">Review Core</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showAssessmentButton && (
                    <div className="flex items-center justify-between py-16 border-t border-slate-200/60 font-sans">
                        <button disabled={currentIndex === 0} onClick={() => { setCurrentIndex(prev => prev - 1); setCurrentComplexity(units[currentIndex - 1].complexity); }} className="flex items-center space-x-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.35em] hover:text-slate-900 transition-all disabled:opacity-0 group">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                            <span>Previous Unit</span>
                        </button>
                        <div className="flex space-x-4">
                            {units.map((u, i) => (
                                <div key={u._id} className={`h-1.5 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-12 bg-emerald-600 shadow-xl' : 'w-4 bg-slate-200'}`} />
                            ))}
                        </div>
                        <div className="w-40" /> {/* Spacer to keep dots centered */}
                    </div>
                )}
            </main>
        </div>
    );
};

export default LessonView;