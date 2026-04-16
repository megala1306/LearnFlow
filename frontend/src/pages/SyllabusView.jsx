import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { 
    Lock, ChevronRight, ArrowLeft, Zap, Sparkles, Loader2, Target, 
    LayoutDashboard, LogOut, AlertTriangle, ShieldCheck, Shield, Box, 
    Layers, Terminal, Activity, MousePointer2, ArrowRight, History, Calendar, BookOpen, Star, BarChart3
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
    <motion.div whileHover={{ x: 5 }} onClick={onClick} className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </motion.div>
);

const SyllabusView = () => {
  const { subjectId } = useParams();
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [stats, setStats] = useState({ xp: 0, retention: 0.85, streak: 0 });

  useEffect(() => {
    if (loading || !user) return;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [subjectsRes, meRes, lessonsRes] = await Promise.all([
          apiClient.get('/subjects').catch(() => ({ data: [] })), 
          apiClient.get('/users/me').catch(() => ({ data: { user: {} } })), 
          apiClient.get(`/lessons?subjectId=${subjectId}`).catch(() => ({ data: [] }))
        ]);
        const userData = meRes?.data?.user || {};
        const subjectsData = subjectsRes?.data || [];
        const currentSubject = (subjectsData || []).find(s => s._id === subjectId);
        setSubject(currentSubject);
        setLessons(lessonsRes?.data || []);
        setIsEnrolled((userData.completedLessons || []).some(cp => cp.subjectId?.toString() === subjectId?.toString()));
        setStats({ xp: userData.xp_points || 0, retention: userData.retention_score || 0.85, streak: userData.streak || 0 });
      } catch (err) { console.error('Error fetching syllabus:', err); } finally { setLoadingData(false); }
    };
    fetchData();
  }, [loading, user, subjectId, navigate]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await apiClient.post('/users/me/enroll', { subjectId });
      await refreshUser();
      setIsEnrolled(true);
    } catch (err) { console.error('Enrollment failed:', err); } finally { setEnrolling(false); }
  };

  const isLessonCompleted = lesson => {
    if (!user || !user.completedLessons) return false;
    const subProgress = user.completedLessons.find(cl => cl.subjectId?.toString() === subjectId?.toString());
    return subProgress ? subProgress.lessons.some(id => id.toString() === lesson._id.toString()) : false;
  };

  const hasImmediateReview = () => {
    if (!user || !user.revisionSchedule) return false;
    const now = new Date();
    return user.revisionSchedule.some(rs => rs.review_type === 'immediate_review' && new Date(rs.next_review) <= now);
  };

  const isLessonLocked = (lesson, index) => {
    if (!isEnrolled) return true;
    if (isLessonCompleted(lesson)) return false;
    if (hasImmediateReview()) return true;
    const currentId = user.currentLesson ? (typeof user.currentLesson === 'string' ? user.currentLesson : user.currentLesson._id?.toString()) : null;
    if (currentId === lesson._id?.toString()) return false;
    if (index === 0) {
      const subProgress = (user.completedLessons || []).find(cl => cl.subjectId?.toString() === subjectId?.toString());
      if (!subProgress || !subProgress.lessons || subProgress.lessons.length === 0) return false;
    }
    return true;
  };

  if (loading || loadingData) return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center space-y-8 font-sans">
      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[1em] animate-pulse">Syncing Hub...</p>
    </div>
  );

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
              <SidebarItem icon={Calendar} label="Schedule" onClick={() => navigate('/schedule')} />
              <SidebarItem icon={BarChart3} label="Neural Flow" onClick={() => navigate('/analytics')} />
          </nav>
          <div className="p-8 border-t border-slate-50">
              <button onClick={logout} className="w-full flex items-center justify-center space-x-3 p-4 bg-rose-50 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all">
                  <LogOut className="w-4 h-4" /><span>Terminate</span>
              </button>
          </div>
      </aside>

      {/* SYLLABUS HUB: REFINED */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
        
        {/* HUD STATUS BAR (SLIM) */}
        <header className="sticky top-0 z-40 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 flex items-center justify-between">
            <div className="flex items-center space-x-10">
                 <button onClick={() => navigate('/courses')} className="flex items-center space-x-3 text-emerald-600 hover:opacity-70 transition-all font-bold text-[10px] uppercase tracking-widest italic"><ArrowLeft className="w-4 h-4" /><span>BACK</span></button>
                 <div className="w-px h-8 bg-slate-100" />
                 {/* REFINED METRICS */}
                 <div className="flex items-center space-x-10">
                     <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">XP</p><p className="text-lg font-bold text-emerald-600 leading-none">{stats.xp}</p></div>
                     <div className="flex flex-col text-center"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Retention</p><p className="text-lg font-bold text-indigo-600 leading-none">{(stats.retention * 100).toFixed(0)}%</p></div>
                 </div>
            </div>
            <div className="flex items-center space-x-4 px-6 py-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10">
                <div className="text-right"><p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">STUDENT</p><p className="text-[10px] font-bold text-white uppercase">{user?.name ? user.name.split(' ')[0] : 'STUDENT'}</p></div>
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">{user?.name ? user.name.charAt(0) : 'S'}</div>
            </div>
        </header>

        <div className="p-10 lg:p-16 max-w-5xl mx-auto space-y-16">
          
          {/* PHASE CARD: REFINED ENROLLMENT */}
          {!isEnrolled && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 bg-slate-900 rounded-[2.5rem] p-16 md:p-20 text-white overflow-hidden relative shadow-xl border-b-4 border-emerald-600">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="space-y-6 flex-1">
                  <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Node Sync Protocol Required</span></div>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Begin Your <span className="text-emerald-400">Mastery Cycle</span>.</h2>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl opacity-90 italic italic">Initialize synchronization to personalize complexity scaling for this module.</p>
                </div>
                <button onClick={handleEnroll} disabled={enrolling} className="w-full lg:w-auto px-12 py-6 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-[0.3em] hover:bg-emerald-50 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-4 italic">
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Initialize Sync</span><Zap className="w-4 h-4 fill-slate-900" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* HUB TITLE AREA: REFINED */}
          <div className={`space-y-8 mb-16 transition-all duration-[1s] ${!isEnrolled ? 'opacity-30 blur-[2px]' : ''}`}>
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Sync Persistent</span></div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 italic uppercase">{subject?.title || "Node Terminal"}</h1>
              </div>
              <div className="flex items-center space-x-4 pt-1">
                  <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-xl border-4 border-white bg-emerald-100 flex items-center justify-center shadow-sm"><Activity className="w-5 h-5 text-emerald-600" /></div>
                      ))}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Active Progression Grid</p>
              </div>
            </div>
            <p className="text-xl text-slate-500 font-medium max-w-4xl leading-relaxed italic">{subject?.description}</p>
          </div>

          {/* NODE LATTICE: COMPACT */}
          <div className={`space-y-10 transition-all duration-[1s] ${!isEnrolled ? 'opacity-30 blur-[2px] translate-y-8' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-8 px-2">
              <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-tight">Knowledge Lattice</h2>
              <div className="px-5 py-2.5 bg-white border border-slate-50 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">{lessons.length} ACTIVE NODES</div>
            </div>

            {hasImmediateReview() && (
              <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 bg-rose-600 rounded-[2rem] text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-10 border-b-4 border-rose-800">
                <div className="flex items-center space-x-6">
                  <div className="p-4 bg-white/20 rounded-2xl"><AlertTriangle className="w-8 h-8 text-white animate-pulse" /></div>
                  <div className="space-y-1"><h3 className="text-2xl font-bold uppercase tracking-tighter italic leading-none">Core Lockdown</h3><p className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-relaxed">Neural decay detected. Access repair immediately.</p></div>
                </div>
                <button onClick={() => navigate('/schedule')} className="w-full lg:w-auto px-10 py-5 bg-white text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-50 transition-all italic">Initialize Repair</button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-6">
              {lessons.map((lesson, idx) => {
                const locked = isLessonLocked(lesson, idx);
                const completed = isLessonCompleted(lesson);
                return (
                  <motion.div key={lesson._id} whileHover={!locked ? { x: 10 } : {}} onClick={() => !locked && navigate(`/lesson/${lesson._id}`)} className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer overflow-hidden ${locked ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-50 shadow-sm hover:shadow-lg hover:border-emerald-500'}`}>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${locked ? 'bg-slate-100 text-slate-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{idx + 1}</div>
                        <div className="space-y-2">
                          <h3 className={`text-2xl font-bold tracking-tight ${locked ? 'text-slate-300' : 'text-slate-900'}`}>{lesson.title}</h3>
                          {completed ? (
                            <div className="flex items-center space-x-2.5"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest italic">Synchronized</span></div>
                          ) : !locked ? (
                            <div className="flex items-center space-x-2.5"><div className="w-2 h-2 bg-amber-500 rounded-full" /><span className="text-amber-500 font-bold text-[9px] uppercase tracking-widest italic">Ready</span></div>
                          ) : lesson.approvedUnitCount === 0 ? (
                            <div className="flex items-center space-x-2.5"><Shield className="w-3 h-3 text-amber-500 animate-pulse" /><span className="text-amber-500 font-bold text-[9px] uppercase tracking-widest italic">Awaiting Admin Approval</span></div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        {locked ? (
                          <div className="flex items-center space-x-3">
                            {lesson.approvedUnitCount === 0 ? (
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Staged</span>
                            ) : <Lock className="w-6 h-6 text-slate-200" />}
                          </div>
                        ) : <div className="w-12 h-12 rounded-xl bg-slate-900 group-hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all"><ArrowRight className="w-6 h-6" /></div>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllabusView;