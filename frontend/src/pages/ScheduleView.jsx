import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, Brain, ArrowLeft, Zap, Target, Sparkles, 
    ChevronRight, Activity, LayoutDashboard, BookOpen, History, 
    BarChart3, LogOut, ShieldCheck 
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import notificationService from '../utils/notificationService';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <motion.div whileHover={{ x: 5 }} onClick={onClick} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </motion.div>
);

const ScheduleView = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ xp: 0, retention: 0.85, streak: 0 });

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const [scheduleRes, meRes] = await Promise.all([
                    apiClient.get('/analytics/schedule').catch(() => ({ data: [] })),
                    apiClient.get('/users/me').catch(() => ({ data: { user: {} } }))
                ]);
                const scheduleData = scheduleRes.data || [];
                setSchedule(scheduleData);
                
                const userData = meRes?.data?.user || {};
                setStats({ 
                    xp: userData.xp_points || 0, 
                    retention: userData.retention_score || 0.85, 
                    streak: userData.streak || 0 
                });

                // Request notification permission and schedule top upcoming review
                if (scheduleData.length > 0) {
                    const upcoming = scheduleData.find(item => new Date(item.next_review) > new Date());
                    if (upcoming) {
                        notificationService.scheduleStudyReminder(upcoming.lessonTitle, upcoming.next_review);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch schedule:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center space-y-8 font-sans">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[1em] animate-pulse">Syncing Memory Grid...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden font-sans relative">
            
            {/* COMPACT SIDEBAR: ELEGANT NEXUS */}
            <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-100 shadow-sm relative z-50">
                <div className="p-10 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">LEARNFLOW</h2>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block opacity-70">Study Terminal</span>
                    </div>
                </div>
                <nav className="px-6 space-y-2 flex-1 pt-6">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/dashboard')} />
                    <SidebarItem icon={BookOpen} label="Curriculum" onClick={() => navigate('/courses')} />
                    <SidebarItem icon={History} label="Activity" />
                    <SidebarItem icon={Calendar} label="Schedule" active />
                    <SidebarItem icon={BarChart3} label="Neural Flow" onClick={() => navigate('/analytics')} />
                </nav>
                <div className="p-8 border-t border-slate-50">
                    <button onClick={logout} className="w-full flex items-center justify-center space-x-3 p-4 bg-rose-50 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                        <LogOut className="w-4 h-4" /><span>Terminate</span>
                    </button>
                </div>
            </aside>

            {/* SCHEDULE HUB: REFINED */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                
                {/* HUD STATUS BAR (SLIM) */}
                <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center space-x-4 lg:space-x-10">
                         <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-3 text-emerald-600 hover:opacity-70 transition-all font-bold text-[10px] uppercase tracking-widest italic"><ArrowLeft className="w-4 h-4" /><span>BACK</span></button>
                         <div className="w-px h-8 bg-slate-100" />
                         {/* REFINED METRICS */}
                         <div className="flex items-center space-x-10">
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">XP</p><p className="text-lg font-bold text-emerald-600 leading-none">{stats.xp}</p></div>
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Retention</p><p className="text-lg font-bold text-indigo-600 leading-none">{(stats.retention * 100).toFixed(0)}%</p></div>
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Streak</p><p className="text-lg font-bold text-amber-600 leading-none">{stats.streak}d</p></div>
                         </div>
                    </div>
                    <div className="flex items-center space-x-4 px-6 py-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                        <div className="text-right"><p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Auth</p><p className="text-[10px] font-bold text-white uppercase">{user?.name ? user.name.split(' ')[0] : 'STUDENT'}</p></div>
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">{user?.name ? user.name.charAt(0) : 'S'}</div>
                    </div>
                </header>

                <div className="p-6 lg:p-16 max-w-5xl mx-auto space-y-10 lg:space-y-12">
                    
                    {/* REFINED HERO AREA */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Cognitive Retention Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Review <span className="text-emerald-600">Protocol</span>.</h1>
                        <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed italic italic">Your personalized repetition schedule for optimal synaptic focus.</p>
                    </div>

                    {/* REFINED SCHEDULE LIST */}
                    <main className="space-y-8">
                        {schedule.length === 0 ? (
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 text-center space-y-6 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <Sparkles className="w-10 h-10 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">Neural Stability Peak</h3>
                                    <p className="text-slate-400 text-sm font-medium">All knowledge nodes are currently synchronized.</p>
                                </div>
                                <button onClick={() => navigate('/courses')} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Explore New Concepts</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 pb-20">
                                {schedule.map((item, idx) => {
                                    const retentionValue = Math.round(item.currentRetention * 100);
                                    const isImmediate = item.review_type === 'immediate_review';
                                    const isLight = item.review_type === 'light_review';
                                    
                                    let borderStyle = 'border-slate-100 bg-white hover:border-emerald-500 hover:shadow-lg';
                                    let accentColor = 'bg-slate-900';
                                    let textColor = 'text-slate-900';

                                    if (isImmediate) {
                                        borderStyle = 'border-red-100 bg-red-50 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/10';
                                        accentColor = 'bg-red-500';
                                        textColor = 'text-red-600';
                                    } else if (isLight) {
                                        borderStyle = 'border-amber-100 bg-amber-50/20 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10';
                                        accentColor = 'bg-amber-500';
                                        textColor = 'text-amber-700';
                                    }

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`group p-8 rounded-[2rem] border-2 transition-all flex flex-col lg:flex-row items-center justify-between gap-10 ${borderStyle}`}
                                        >
                                            <div className="flex items-center space-x-8 flex-1">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm shrink-0 ${accentColor} text-white`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest ${isImmediate ? 'bg-red-100 text-red-600' : isLight ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {isImmediate ? 'IMMEDIATE REPAIR' : isLight ? 'LIGHT REFRESH' : 'SYNCED'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center italic">
                                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                            {item.daysSinceReview}d ago
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-2xl font-bold tracking-tight italic group-hover:text-emerald-700 transition-colors leading-none ${textColor}`}>
                                                        {item.lessonTitle}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="w-full lg:w-64 space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-0.5 text-center lg:text-left">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Neural Fidelity</p>
                                                        <p className={`text-xl font-bold leading-none mt-1 ${textColor}`}>{retentionValue}%</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{isImmediate ? 'REPAIR REQD' : 'Next Sync'}</p>
                                                        <p className={`text-xs font-bold uppercase tracking-tight mt-1 ${textColor}`}>{new Date(item.next_review).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${retentionValue}%` }}
                                                        className={`h-full rounded-full ${accentColor}`}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                disabled={!item.lessonId}
                                                onClick={() => {
                                                    if (!item.lessonId) return;
                                                    navigate(`/lesson/${item.lessonId}`, { 
                                                        state: { 
                                                            mode: 'repair', 
                                                            reviewType: item.review_type,
                                                            weakTopics: item.weakTopics,
                                                            unitId: item.unit_id
                                                        } 
                                                    });
                                                }}
                                                className={`px-8 py-4 border rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center group/btn ${!item.lessonId ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : (isImmediate ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' : isLight ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' : 'bg-white text-slate-900 border-slate-200 hover:bg-emerald-600 hover:text-white')}`}
                                            >
                                                {item.lessonId ? (isImmediate ? 'Launch Repair' : isLight ? 'Light Review' : 'Initialize') : 'Offline'}
                                                <Zap className={`ml-2.5 w-4 h-4 ${!item.lessonId ? 'text-slate-200' : (isImmediate || isLight ? 'fill-white text-white' : 'text-slate-400 group-hover/btn:fill-white group-hover/btn:text-white')}`} />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            {/* MOBILE BOTTOM NAV */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex items-center justify-around py-4 pb-6 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <LayoutDashboard className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Home</span>
                </button>
                <button onClick={() => navigate('/courses')} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <BookOpen className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Grid</span>
                </button>
                <button onClick={() => navigate('/schedule')} className="flex flex-col items-center text-emerald-600 transition-colors">
                    <Calendar className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Schedule</span>
                </button>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <BarChart3 className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Flow</span>
                </button>
                 <button onClick={logout} className="flex flex-col items-center text-rose-400 hover:text-rose-600 transition-colors">
                    <LogOut className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Exit</span>
                </button>
            </div>
            
        </div>
    );
};

// Add missing Loader2 import
const Loader2 = ({ className }) => <Activity className={`${className} animate-spin`} />;

export default ScheduleView;
