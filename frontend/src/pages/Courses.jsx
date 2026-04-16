import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, BookOpen, Clock, Loader2,
    ArrowRight, Star, GraduationCap, ChevronLeft, LayoutGrid, List,
    Zap, Sparkles, Cpu, Globe, Rocket, Brain, Code, Database, Heart,
    Mail, Lock, User, Shield, Fingerprint, X, Terminal, Activity,
    TrendingUp, Award, Layers, History, Calendar, LayoutDashboard, ShieldCheck, LogOut, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <motion.div whileHover={{ x: 5 }} onClick={onClick} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </motion.div>
);

const MOCK_COURSES = [
    { _id: 'm1', title: 'Machine Learning Fundamentals', description: 'Explore regression, clustering, and neural networks from scratch.', category: 'AI & ML', difficulty: 'Beginner', rating: 4.8 },
    { _id: 'm2', title: 'Full-Stack Development', description: 'Master the modern web with React, Node.js, and MongoDB.', category: 'Web Development', difficulty: 'Advanced', rating: 4.9 },
    { _id: 'm3', title: 'Quantum Algorithms', description: 'Understanding qubits, superposition, and Grover\'s search.', category: 'Computing', difficulty: 'Expert', rating: 4.7 },
    { _id: 'm4', title: 'Data Structures & Logic', description: 'Building efficient systems through algorithmic mastery.', category: 'Computer Science', difficulty: 'Intermediate', rating: 4.9 },
    { _id: 'm5', title: 'Cybersecurity Protocols', description: 'Defending the neural grid against advanced persistent threats.', category: 'Security', difficulty: 'Advanced', rating: 4.6 },
    { _id: 'm6', title: 'UI/UX Design Systems', description: 'Creating premium visual experiences and micro-interactions.', category: 'Design', difficulty: 'Beginner', rating: 5.0 }
];

const Courses = () => {
    const navigate = useNavigate();
    const { user, loading: authLoadingState, login, register, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [stats, setStats] = useState({ xp: 0, retention: 0.85, streak: 0 });

    useEffect(() => {
        if (!authLoadingState && user?.needs_diagnostic) navigate('/diagnostic');
    }, [user, authLoadingState, navigate]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const [subjectsRes, meRes] = await Promise.all([
                    apiClient.get('/subjects').catch(() => ({ data: [] })), 
                    apiClient.get('/users/me').catch(() => ({ data: { user: {} } }))
                ]);
                const userData = meRes?.data?.user || {};
                const subjectsData = subjectsRes?.data || [];
                const merged = subjectsData.length > 0 
                    ? [...subjectsData, ...MOCK_COURSES.filter(mc => !subjectsData.find(rc => rc.title.toLowerCase() === mc.title.toLowerCase()))] 
                    : MOCK_COURSES;
                setCourses(merged);
                setStats({ xp: userData.xp_points || 0, retention: userData.retention_score || 0.85, streak: userData.streak || 0 });
            } catch (err) { setCourses(MOCK_COURSES); } finally { setLoading(false); }
        };
        fetchCourses();
    }, []);

    const categories = ['All', 'AI & ML', 'Web Development', 'Computer Science', 'Mathematics', 'Design', 'Security', 'Robotics', 'Web3'];

    const filteredCourses = (courses || []).filter(c => {
        const title = c?.title || '';
        const category = c?.category || '';
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryStyles = (cat) => {
        switch (cat) {
            case 'AI & ML': return { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <Brain className="w-10 h-10" /> };
            case 'Web Development': return { bg: 'bg-teal-600', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: <Code className="w-10 h-10" /> };
            default: return { bg: 'bg-slate-900', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: <BookOpen className="w-10 h-10" /> };
        }
    };

    return (
        <div className="flex h-screen bg-[#fcfdfe] text-slate-900 overflow-hidden font-sans">
            
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
                    <SidebarItem icon={BookOpen} label="Curriculum" active />
                    <SidebarItem icon={History} label="Activity" />
                    <SidebarItem icon={Calendar} label="Schedule" onClick={() => navigate('/schedule')} />
                    <SidebarItem icon={BarChart3} label="Neural Flow" onClick={() => navigate('/analytics')} />
                </nav>
                <div className="p-8 border-t border-slate-50">
                    <button onClick={logout} className="w-full flex items-center justify-center space-x-3 p-4 bg-rose-50 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                        <LogOut className="w-4 h-4" /><span>Terminate</span>
                    </button>
                </div>
            </aside>

            {/* CURRICULUM TERMINAL: REFINED */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                
                {/* HUD STATUS BAR (SLIM) */}
                <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                         <div className="flex flex-col"><p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1 opacity-70 leading-none">Status</p><h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Curriculum</h2></div>
                         <div className="w-px h-8 bg-slate-100" />
                         {/* REFINED METRICS */}
                         <div className="flex items-center space-x-10">
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">XP</p><p className="text-lg font-bold text-emerald-600 leading-none">{stats.xp}</p></div>
                             <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Retention</p><p className="text-lg font-bold text-indigo-600 leading-none">{(stats.retention * 100).toFixed(0)}%</p></div>
                         </div>
                    </div>
                    <div className="flex items-center space-x-6">
                         <div className="flex items-center space-x-4 px-6 py-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                            <div className="text-right"><p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Auth</p><p className="text-[10px] font-bold text-white uppercase">{user?.name ? user.name.split(' ')[0] : 'STUDENT'}</p></div>
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">{user?.name ? user.name.charAt(0) : 'S'}</div>
                        </div>
                    </div>
                </header>

                <div className="p-10 lg:p-16 max-w-[1500px] mx-auto space-y-16">
                    
                    {/* REFINED HERO GRID */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="space-y-6 max-w-4xl">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Knowledge <span className="text-emerald-600">Lattice</span>.</h1>
                            <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">Access distributed learning nodes engineered for cognitive stability.</p>
                            <div className="relative group w-full max-w-xl pt-2">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input type="text" placeholder="Search available nodes..." className="w-full h-16 pl-16 pr-8 bg-white border border-slate-100 rounded-2xl text-slate-900 font-medium placeholder:text-slate-300 focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-300 transition-all outline-none shadow-sm text-base" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* REFINED FILTER CHIPS */}
                    <div className="flex flex-wrap items-center gap-3">
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-emerald-600 hover:bg-white border border-slate-50'}`}>{cat}</button>
                        ))}
                    </div>

                    {/* CRYSTALLINE GRID */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 space-y-8"><Loader2 className="w-12 h-12 text-emerald-600 animate-spin" /><p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest animate-pulse italic">Connecting to Grid...</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40">
                             {filteredCourses.map((course, idx) => {
                                const style = getCategoryStyles(course.category);
                                return (
                                    <motion.div key={course._id} whileHover={{ y: -8 }} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-10 transition-all cursor-pointer shadow-sm hover:shadow-xl overflow-hidden" onClick={() => navigate(`/syllabus/${course._id}`)}>
                                        <div className="flex flex-col h-full relative z-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className={`w-20 h-20 rounded-2xl ${style.light} flex items-center justify-center border border-slate-50 group-hover:bg-white group-hover:shadow-inner transition-all duration-500`}>
                                                    <div className={style.text}>{style.icon}</div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                                                    <div className="flex items-center space-x-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-50"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /><span className="text-xs font-bold text-amber-700">4.9</span></div>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl ${style.bg} text-white`}>{course.difficulty || 'Expert'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <p className={`text-[9px] font-bold uppercase tracking-widest ${style.text} opacity-80 leading-none`}>{course.category || 'Focus Node'}</p>
                                                <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{course.title}</h3>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2 opacity-80">{course.description}</p>
                                            </div>
                                            <div className="pt-8 border-t border-slate-50 flex items-center justify-between"><div className="space-y-1"><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none italic">Phase</p><p className="text-sm font-bold text-emerald-600 leading-none">AVAILABLE</p></div><div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white group-hover:bg-emerald-600 transition-all"><ArrowRight className="w-6 h-6" /></div></div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Courses;
