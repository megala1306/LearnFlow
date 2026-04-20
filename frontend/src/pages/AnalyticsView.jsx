import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
    Activity, TrendingUp, Users, Brain, Target, ChevronLeft, 
    LayoutDashboard, BookOpen, History, Calendar, BarChart3, 
    LogOut, Zap, ArrowLeft, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <motion.div whileHover={{ x: 5 }} onClick={onClick} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </motion.div>
);

const AnalyticsView = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ xp: 0, retention: 0.85, streak: 0 });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const endpoint = user?.role === 'admin' ? '/analytics/admin' : '/analytics/student';
                const [analyticsRes, meRes] = await Promise.all([
                    apiClient.get(endpoint).catch(() => ({ data: {} })),
                    apiClient.get('/users/me').catch(() => ({ data: { user: {} } }))
                ]);
                setData(analyticsRes.data);
                const userData = meRes?.data?.user || {};
                setStats({ 
                    xp: userData.xp_points || 0, 
                    retention: userData.retention_score || 0.85, 
                    streak: userData.streak || 0 
                });
            } catch (err) {
                console.error("Error fetching analytics", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchAnalytics();
    }, [user]);

    const COLORS = ['#10b981', '#6366f1', '#0ea5e9', '#d946ef', '#f59e0b'];

    if (loading || authLoading) return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center space-y-8 font-sans">
            <Activity className="w-12 h-12 text-emerald-600 animate-spin" />
            <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[1em] animate-pulse">Syncing Neural Grid...</p>
        </div>
    );

    const chartData = user?.role === 'admin' ? (data?.daily || []) : (data?.trend || []).map(i => ({
        _id: new Date(i.date).toLocaleDateString(),
        actual: i.accuracy * 100,
        complexity: i.complexity
    }));

    // Generate Predictive Curve (Next 7 points)
    const k = data?.forgetting_rate || 0.1;
    const lastActual = chartData.length > 0 ? chartData[chartData.length - 1].actual : 85;
    const predictiveData = Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        return {
            _id: `+${day}d`,
            predicted: lastActual * Math.exp(-k * day)
        };
    });
    const combinedChartData = [...chartData, ...predictiveData];

    const subjectData = user?.role === 'admin'
        ? data?.subjects?.map(s => ({ name: s._id, value: s.count })) || []
        : data?.mastery || [];

    const activityGrid = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayData = data?.activity?.find(a => a._id === dateStr);
        return { date: dateStr, count: dayData ? dayData.count : 0 };
    });

    return (
        <div className="flex h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden font-sans relative">
            
            {/* COMPACT SIDEBAR: ELEGANT NEXUS */}
            <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-100 shadow-sm relative z-50">
                <div className="p-10 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}>
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">LEARNFLOW</h2>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block opacity-70">Study Terminal</span>
                    </div>
                </div>
                <nav className="px-6 space-y-2 flex-1 pt-6">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')} />
                    <SidebarItem icon={BookOpen} label="Curriculum" onClick={() => navigate('/courses')} />
                    <SidebarItem icon={History} label="Activity" />
                    <SidebarItem icon={Calendar} label="Schedule" onClick={() => navigate('/schedule')} />
                    <SidebarItem icon={BarChart3} label="Neural Flow" active />
                </nav>
                <div className="p-8 border-t border-slate-50">
                    <button onClick={logout} className="w-full flex items-center justify-center space-x-3 p-4 bg-rose-50 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                        <LogOut className="w-4 h-4" /><span>Terminate</span>
                    </button>
                </div>
            </aside>

            {/* ANALYTICS HUB: REFINED */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                
                {/* HUD STATUS BAR (SLIM) */}
                <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center space-x-4 lg:space-x-10">
                         <button onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')} className="flex items-center space-x-3 text-emerald-600 hover:opacity-70 transition-all font-bold text-[10px] uppercase tracking-widest italic"><ArrowLeft className="w-4 h-4" /><span>BACK</span></button>
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

                <div className="p-6 lg:p-16 max-w-7xl mx-auto space-y-10 lg:space-y-12">
                    
                    {/* REFINED HERO AREA */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Neural Analytics Core</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 italic uppercase">Neural <span className="text-emerald-600">Flow</span>.</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Main Performance Chart */}
                        <div className="bg-white border border-slate-100 lg:col-span-2 p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Accuracy Velocity</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Your neural sync trends</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Vector: Cognitive Fidelity</div>
                            </div>

                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={combinedChartData}>
                                        <defs>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="_id" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fill="url(#colorActual)" dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Actual Sync" />
                                        <Area type="monotone" dataKey="predicted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" fill="transparent" name="Predictive Decay" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Intensity Heatmap */}
                        <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm group">
                            <div className="flex items-center space-x-4 mb-10">
                                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Intensity</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">30-Day Module Heatmap</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-6 md:grid-cols-10 gap-2 px-2">
                                 {activityGrid.map((day, i) => (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ scale: 1.15 }}
                                        className={`w-full aspect-square rounded-lg border border-slate-50 ${
                                            day.count === 0 ? 'bg-slate-50' :
                                            day.count < 3 ? 'bg-emerald-100' :
                                            day.count < 6 ? 'bg-emerald-300' : 'bg-emerald-600'
                                        }`}
                                        title={`${day.date}: ${day.count} nodes`}
                                    />
                                 ))}
                            </div>
                            <div className="mt-8 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                                <span>Cycle Start</span>
                                <div className="flex items-center space-x-2">
                                    <span>Low</span>
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-slate-50 rounded-sm" />
                                        <div className="w-2 h-2 bg-emerald-100 rounded-sm" />
                                        <div className="w-2 h-2 bg-emerald-300 rounded-sm" />
                                        <div className="w-2 h-2 bg-emerald-600 rounded-sm" />
                                    </div>
                                    <span>Peak</span>
                                </div>
                            </div>
                        </div>

                        {/* Subject Pie */}
                        <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm group">
                            <div className="flex items-center space-x-4 mb-10">
                                <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Breakdown</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Neural density per node</p>
                                </div>
                            </div>
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={subjectData.length > 0 ? subjectData : [{ name: 'No Data', value: 1 }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {subjectData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                 {subjectData.map((s, i) => (
                                     <div key={i} className="flex items-center space-x-2">
                                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                         <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{s.name}</span>
                                     </div>
                                 ))}
                            </div>
                        </div>
                    </div>
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
                <button onClick={() => navigate('/schedule')} className="flex flex-col items-center text-slate-400 hover:text-emerald-600 transition-colors">
                    <Calendar className="w-5 h-5 mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">Schedule</span>
                </button>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center text-emerald-600 transition-colors">
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

export default AnalyticsView;
