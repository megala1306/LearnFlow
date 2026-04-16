import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, BookOpen, BarChart3, Settings, LogOut,
    Flame, Zap, Target, TrendingUp, ChevronRight, Award,
    Cpu, Sparkles, Menu, X, Bell, Search, Calendar, ArrowUpRight,
    Star, Heart, Shield, Globe, Users, Clock, Activity, ShieldCheck, 
    ArrowRight, Terminal, Box, Layers, MousePointer2, History, ListChecks, Brain
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <motion.div whileHover={{ x: 5 }} onClick={onClick} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </motion.div>
);

const Dashboard = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [stats, setStats] = useState({ xp: 0, retention: 0.85, streak: 0 });
    const [completedCount, setCompletedCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [dailyActivity, setDailyActivity] = useState([0, 0, 0, 0, 0, 0, 0]);

    const getXaiMessage = () => {
        if (!user) return "Initializing neural interface...";
        
        const hasEnrolled = user.completedLessons?.length > 0;
        const hasFinishedSomething = user.completedLessons?.some(cp => cp.lessons?.length > 0);

        if (!hasEnrolled) {
            return "Welcome to LearnFlow! Your cognitive profile is ready for initialization. Head to the curriculum grid to begin your first masterclass.";
        }
        
        if (!hasFinishedSomething) {
            return `Initialization successful. I've synced your profile with '${subjects[0]?.title || "the grid"}'. Complete your first lesson to generate your baseline retention curve.`;
        }

        if (stats.retention < 0.6) {
            return `Based on your recent retention drop to ${(stats.retention * 100).toFixed(0)}%, I recommend an immediate 15-min focused repair session to stabilize your mastery.`;
        }
        return "Cognitive stability is high. Your neural retention is optimal across all active modules. Continue with your primary study path.";
    };

    useEffect(() => {
        if (loading || !user) return;
        const fetchData = async () => {
            try {
                const [subjectsRes, meRes, lessonsRes, interactionsRes] = await Promise.all([
                    apiClient.get('/subjects').catch(() => ({ data: [] })), 
                    apiClient.get('/users/me').catch(() => ({ data: { user: {} } })), 
                    apiClient.get('/lessons').catch(() => ({ data: [] })),
                    apiClient.get('/interactions').catch(() => ({ data: [] }))
                ]);
                const userData = meRes?.data?.user || {};
                const subjectsData = subjectsRes?.data || [];
                const interactions = interactionsRes?.data || [];

                // Process last 7 days for Phase Radar
                const activityCounts = [0, 0, 0, 0, 0, 0, 0];
                const now_date = new Date();
                now_date.setHours(23, 59, 59, 999);
                
                interactions.forEach(inter => {
                    const interDate = new Date(inter.timestamp);
                    const diffTime = Math.abs(now_date - interDate);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 7) {
                        activityCounts[6 - diffDays]++;
                    }
                });

                const maxVal = Math.max(...activityCounts, 1);
                const scaledActivity = activityCounts.map(c => c === 0 ? 0 : Math.max((c / maxVal) * 100, 25));
                setDailyActivity(scaledActivity);

                const activeSubjectIds = (userData.completedLessons || []).map(cp => cp.subjectId?.toString()).filter(Boolean);
                setSubjects((subjectsData || []).filter(s => activeSubjectIds.includes(s._id.toString())));
                setCompletedCount(userData.completedLessons?.length || 0);
                const now = new Date();
                setSchedules((userData.revisionSchedule || []).filter(sch => new Date(sch.next_review) <= now).map(sch => {
                    const lesson = (lessonsRes?.data || []).find(l => l._id === sch.lessonId);
                    return { ...sch, lessonTitle: lesson ? lesson.title : 'Technical Module', review_type: sch.review_type };
                }));
                setStats({ xp: userData.xp_points || 0, streak: userData.streak || 0, retention: userData.retention_score || 0.85 });
            } catch (err) { console.error('Dashboard Sync Error', err); }
        };
        fetchData();
    }, [user, loading, navigate]);

    return (
        <div className="flex h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden font-sans">
            
            {/* COMPACT SIDEBAR: ELEGANT NEXUS */}
            <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-100 shadow-sm relative z-50">
                <div className="p-10 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">LEARNFLOW</h2>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block opacity-70">Study Terminal</span>
                    </div>
                </div>
                <nav className="px-6 space-y-2 flex-1 pt-6">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                    <SidebarItem icon={BookOpen} label="Curriculum" onClick={() => navigate('/courses')} />
                    <SidebarItem icon={Calendar} label="Schedule" onClick={() => navigate('/schedule')} />
                    <SidebarItem icon={BarChart3} label="Neural Flow" onClick={() => navigate('/analytics')} />
                </nav>
                <div className="p-8 border-t border-slate-50">
                    <button onClick={logout} className="w-full flex items-center justify-center space-x-3 p-4 bg-rose-50 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                        <LogOut className="w-4 h-4" /><span>Terminate</span>
                    </button>
                </div>
            </aside>

            {/* MAIN INTERFACE: REFINED TERM */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                
                {/* HUD STATUS BAR (SLIM) */}
                <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                         <div className="flex flex-col"><p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1 opacity-70 leading-none">Status</p><h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Active</h2></div>
                         <div className="w-px h-8 bg-slate-100" />
                         {/* REFINED METRICS */}
                         <div className="flex items-center space-x-10">
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">XP</p><p className="text-lg font-bold text-emerald-600 leading-none">{stats.xp}</p></div>
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Retention</p><p className="text-lg font-bold text-indigo-600 leading-none">{(stats.retention * 100).toFixed(0)}%</p></div>
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Streak</p><p className="text-lg font-bold text-amber-600 leading-none">{stats.streak}d</p></div>
                         </div>
                    </div>
                    <div className="flex items-center space-x-6">
                         <div className="flex items-center space-x-4 px-6 py-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                            <div className="text-right"><p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">STUDENT</p><p className="text-[10px] font-bold text-white uppercase">{user?.name ? user.name.split(' ')[0] : 'STUDENT'}</p></div>
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">{user?.name ? user.name.charAt(0) : 'S'}</div>
                        </div>
                    </div>
                </header>

                <div className="p-10 lg:p-16 max-w-6xl mx-auto space-y-16">
                    
                    {/* QUARTZ WELCOME MODAL */}
                    <div className="relative bg-emerald-50/40 border border-emerald-100/50 p-12 md:p-16 rounded-[2.5rem] shadow-sm overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/60 blur-[100px] rounded-full" />
                        <div className="relative z-10 space-y-8">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Welcome Back, <span className="text-emerald-600">{user?.name ? user.name.split(' ')[0] : 'Explorer'}</span>.</h1>
                            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                                {subjects.length > 0 ? `Currently synchronized with ${subjects.length} active knowledge nodes. Ready for next masterclass?` : "Your cognitive profile is stable. Proceed to the knowledge grid to initialize your next study session."}
                            </p>
                            <div className="flex items-center space-x-6">
                                <button onClick={() => navigate('/courses')} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center space-x-4">
                                    <span>{subjects.length > 0 ? "Access Grid" : "Initialize Curriculum"}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <div className="hidden md:flex items-center space-x-3 text-emerald-600 font-bold text-[10px] uppercase tracking-widest"><Sparkles className="w-4 h-4" /><span>System Nominal</span></div>
                            </div>
                        </div>
                    </div>

                    {/* ACTIVE NODES LATTICE (NEW) */}
                    {subjects.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Active Learning Lattice</h2>
                                <button onClick={() => navigate('/courses')} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:opacity-70 transition-all flex items-center gap-2"><span>Expand Grid</span><ChevronRight className="w-3 h-3" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {subjects.map((s) => (
                                    <motion.div 
                                        key={s._id} 
                                        whileHover={{ y: -5 }} 
                                        onClick={() => navigate(`/syllabus/${s._id}`)}
                                        className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 transition-all">
                                                    <BookOpen className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Mastery</span>
                                                    <span className="text-xs font-bold text-emerald-600">IN SYNC</span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight truncate">{s.title}</h3>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center space-x-2">
                                                    <Activity className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Healthy Status</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* XAI: INTELLIGENCE INSIGHTS (NEW) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Intelligence Insights [XAI]</h2><Brain className="w-5 h-5 text-emerald-500" /></div>
                            <div className="flex-1 bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-xl shadow-emerald-600/20 border-b-4 border-emerald-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-6 flex-1">
                                    <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl border border-white/5">
                                        <Sparkles className="w-4 h-4 text-emerald-300" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">AI Study Agent</span>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold leading-relaxed italic pr-6 h-[8.5rem] flex items-center">
                                        "{getXaiMessage()}"
                                    </p>
                                </div>
                                <button onClick={() => navigate('/schedule')} className="w-full lg:w-auto px-10 py-5 bg-white text-emerald-700 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all">Launch Repair</button>
                            </div>
                        </div>
                        </div>

                        {/* PHASE RADAR: PERFORMANCE LINKED */}
                        <div className="w-full lg:w-96 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative group overflow-hidden">
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Phase Radar</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Study Intensity</p>
                                </div>
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex items-end justify-between h-32 px-2 gap-2">
                                {subjects.length === 0 ? (
                                    <div className="w-full flex flex-col items-center justify-center space-y-4 opacity-30">
                                        <div className="w-full h-1 bg-slate-50 rounded-full" />
                                        <p className="text-[8px] font-bold uppercase tracking-widest">Wait for Sync</p>
                                    </div>
                                ) : !dailyActivity.some(v => v > 0) ? (
                                    <div className="w-full flex flex-col items-center justify-center space-y-4 opacity-70">
                                        <div className="flex space-x-2">
                                            {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-2 h-8 bg-emerald-50 rounded-md animate-pulse" style={{ animationDelay: `${i*100}ms` }} />)}
                                        </div>
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600">Calibrating Node Data...</p>
                                    </div>
                                ) : (
                                    dailyActivity.map((h, i) => (
                                        <div key={i} className="flex-1 bg-emerald-100 rounded-lg relative group/bar overflow-hidden hover:bg-emerald-600 transition-all shadow-sm" style={{ height: `${h || 5}%`, opacity: h === 0 ? 0.3 : 1 }}>
                                            <div className="absolute inset-0 bg-emerald-600/10 translate-y-full group-hover/bar:translate-y-0 transition-transform" />
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="mt-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest text-center italic">
                                {dailyActivity.some(v => v > 0) ? "Neural Fidelity Curve: Optimal" : "Awaiting Daily Calibration"}
                            </p>
                        </div>
                    </div>

                    {/* SCHEDULE TERMINAL: FULL WIDTH */}
                    <div className="pb-20">
                         <div className="space-y-8 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Schedule Terminal</h2>
                             {schedules.length > 0 ? (
                                <div onClick={() => navigate('/schedule')} className={`p-10 rounded-[2.5rem] text-white space-y-6 shadow-xl cursor-pointer hover:scale-[1.01] transition-all ${schedules[0].review_type === 'immediate_review' ? 'bg-red-600 shadow-red-900/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
                                     <div className={`flex items-center space-x-3 font-bold text-[9px] uppercase tracking-widest ${schedules[0].review_type === 'immediate_review' ? 'text-red-200' : 'text-amber-400'}`}><Clock className="w-4 h-4" /><span>{schedules[0].review_type === 'immediate_review' ? 'Immediate Repair' : 'Sync Pending'}</span></div>
                                     <h4 className="text-xl font-bold italic leading-tight">{schedules[0].review_type === 'immediate_review' ? 'REPAIR' : 'REVIEW'}: {schedules[0].lessonTitle}</h4>
                                     <p className="text-slate-200 text-sm leading-relaxed opacity-80 italic italic">
                                         {schedules[0].review_type === 'immediate_review' ? 'Neural data is rapidly decaying. Immediate synchronization required.' : 'Neural data decaying in this module. Synchronize today.'}
                                     </p>
                                     <button className="w-full py-4 border border-white/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Open Planner</button>
                                </div>
                            ) : (
                                <div className="p-16 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                                     <ShieldCheck className="w-12 h-12 text-slate-200" />
                                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Protocol Sync Nominal</p>
                                </div>
                            )}
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
