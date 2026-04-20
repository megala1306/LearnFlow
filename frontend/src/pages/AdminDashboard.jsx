import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, BookOpen, CheckCircle, Clock,
    Check, X, BarChart3, LogOut, ChevronRight, AlertCircle, Cpu, Brain, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [pendingUnits, setPendingUnits] = useState([]);
    const [approvedUnits, setApprovedUnits] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'students' | 'approved'
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    // Intelligence State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [intelligenceData, setIntelligenceData] = useState(null);
    const [intelligenceLoading, setIntelligenceLoading] = useState(false);


    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await apiClient.get('/admin/stats');
            setStats(statsRes.data);
            console.log('Stats Check:', statsRes.data);
        } catch (err) {
            console.error('Stats fetch failed:', err.response?.status, err.response?.data);
        }
        try {
            const pendingRes = await apiClient.get('/admin/pending-content');
            setPendingUnits(pendingRes.data);
            console.log('Pending Units Debug:', pendingRes.data);
        } catch (err) {
            console.error('Pending content fetch failed:', err.response?.status, err.response?.data);
        }
        try {
            const approvedRes = await apiClient.get('/admin/all-content?status=approved');
            setApprovedUnits(approvedRes.data);
            console.log('Approved Units Debug:', approvedRes.data);
        } catch (err) {
            console.error('Approved content fetch failed:', err.response?.status, err.response?.data);
        }
        try {
            const studentsRes = await apiClient.get('/admin/users');
            setStudents(studentsRes.data);
        } catch (err) {
            console.error('Students fetch failed:', err.response?.status, err.response?.data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (unitId, type) => {
        setActionLoading(`${unitId}-${type}`);
        try {
            const payload = type === 'lesson' ? { approved: true } : { assessmentApproved: true };
            await apiClient.patch(`/admin/approve-content/${unitId}`, payload);
            showToast(`${type === 'lesson' ? 'Lesson Content' : 'Assessment'} updated successfully`);
        } catch (err) {
            showToast('Failed to update content approval', 'error');
        } finally {
            setActionLoading(null);
            fetchData(); // Sync counters and lists
        }
    };

    const handleRevoke = async (unitId, type) => {
        setActionLoading(`${unitId}-revoke-${type}`);
        try {
            const payload = type === 'lesson' ? { approved: false } : { assessmentApproved: false };
            await apiClient.patch(`/admin/approve-content/${unitId}`, payload);
            showToast(`${type === 'lesson' ? 'Lesson' : 'Assessment'} revoked`);
        } catch (err) {
            showToast('Failed to revoke', 'error');
        } finally {
            setActionLoading(null);
            fetchData();
        }
    };

    const handleApproveAll = async () => {
        setActionLoading('all');
        try {
            await Promise.all(pendingUnits.map(u =>
                apiClient.patch(`/admin/approve-content/${u._id}`, { approved: true, assessmentApproved: true })
            ));
            const count = pendingUnits.length;
            setPendingUnits([]);
            showToast(`All ${count} units approved`);
            fetchData();
        } catch (err) {
            showToast('Failed to approve all', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleViewIntelligence = async (studentId) => {
        setSelectedStudent(studentId);
        setIntelligenceLoading(true);
        try {
            const res = await apiClient.get(`/admin/user-intelligence/${studentId}`);
            setIntelligenceData(res.data);
        } catch (err) {
            showToast('Failed to fetch cognitive history', 'error');
            console.error('[ADMIN-INTEL-UI] Fetch Error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
        } finally {
            setIntelligenceLoading(false);
        }
    };


    const getModuleLabel = (unit) => {
        // Try multiple paths to find the lesson title
        const fromModule = unit.module_id?.lesson_id?.title;
        const fromLesson = unit.lessonId?.title;
        const fromDirect = unit.title; // Fallback
        
        return fromModule || fromLesson || fromDirect || `Curriculum Unit (#${unit._id?.slice(-4)})`;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">LearnFlow Admin</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Control Panel</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500">{user?.name}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

                {/* Simplified Action Center */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => navigate('/admin/content')}
                        className="bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4 hover:border-emerald-200 hover:shadow-xl transition-all group shadow-sm"
                    >
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Curriculum</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Insert / Update Lessons & Units</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4 hover:border-primary-200 hover:shadow-xl transition-all group shadow-sm"
                    >
                        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-8 h-8 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Learner Analytics</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monitor Class Performance</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('students')}
                        className="bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4 hover:border-indigo-200 hover:shadow-xl transition-all group shadow-sm"
                    >
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Leaner Profiles</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Individual neural history</p>
                        </div>
                    </button>
                </div>

                {/* Secondary Actions / Approval Focus */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-8 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Approval Queue</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">You have {Array.isArray(pendingUnits) ? pendingUnits.filter(u => !u.isApproved || !u.isAssessmentApproved).length : 0} items awaiting review</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveTab('approvals')}
                        className="px-6 py-3 bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        View Queue →
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        {[
                            { id: 'approvals', label: 'Fresh Content', badge: Array.isArray(pendingUnits) ? pendingUnits.filter(u => !u.isApproved && !u.isAssessmentApproved).length : 0 },
                            { id: 'partial', label: 'Partial Approvals', badge: Array.isArray(pendingUnits) ? pendingUnits.filter(u => (u.isApproved && !u.isAssessmentApproved) || (!u.isApproved && u.isAssessmentApproved)).length : 0 },
                            { id: 'approved', label: 'Approved Content', badge: stats?.approved_content },
                            { id: 'students', label: 'Learner Profiles', badge: students?.length || 0 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600 bg-primary-50/40'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Pending Approvals Tab */}
                        {activeTab === 'approvals' && (
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin mr-3" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : (Array.isArray(pendingUnits) ? pendingUnits.filter(u => !u.isApproved && !u.isAssessmentApproved).length : 0) === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                                        <Clock className="w-10 h-10 text-amber-200" />
                                        <p className="text-sm font-black uppercase tracking-widest">No unstarted approvals</p>
                                    </div>
                                ) : (
                                    <motion.div key="approvals" className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs text-slate-500 font-bold">{Array.isArray(pendingUnits) ? pendingUnits.filter(u => !u.isApproved && !u.isAssessmentApproved).length : 0} unit(s) awaiting initial review</p>
                                            <button
                                                onClick={handleApproveAll}
                                                disabled={actionLoading === 'all'}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === 'all' ? 'Approving...' : 'Approve All Fresh'}
                                            </button>
                                        </div>
                                        {Array.isArray(pendingUnits) && pendingUnits.filter(u => !u.isApproved && !u.isAssessmentApproved).map((unit, i) => (
                                            <motion.div
                                                key={unit._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-all"
                                            >
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <p className="text-sm font-black text-slate-900 truncate">
                                                        {getModuleLabel(unit)}
                                                    </p>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                                            unit.complexity === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                                                            unit.complexity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>{unit.complexity}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase">
                                                            {unit.module_id?.module_type?.replace('_', ' ') || 'Unknown type'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col space-y-2 shrink-0 border-l border-slate-200 pl-4">
                                                    {!unit.isApproved && (
                                                        <button
                                                            onClick={() => handleApprove(unit._id, 'lesson')}
                                                            disabled={actionLoading === `${unit._id}-lesson`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 w-full justify-center"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            <span>{actionLoading === `${unit._id}-lesson` ? '...' : 'Approve Lesson'}</span>
                                                        </button>
                                                    )}
                                                    {unit.isApproved && (
                                                        <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest w-full justify-center border border-emerald-200">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Lesson Approved</span>
                                                        </div>
                                                    )}
                                                    
                                                    {!unit.isAssessmentApproved && (
                                                        <button
                                                            onClick={() => handleApprove(unit._id, 'assessment')}
                                                            disabled={actionLoading === `${unit._id}-assessment`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 w-full justify-center"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            <span>{actionLoading === `${unit._id}-assessment` ? '...' : `Approve Assessment (${unit.quiz_questions?.length || 0} Qs)`}</span>
                                                        </button>
                                                    )}
                                                    {unit.isAssessmentApproved && (
                                                        <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest w-full justify-center border border-indigo-200">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Assessment Approved</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* Partial Approvals Tab */}
                        {activeTab === 'partial' && (
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : (Array.isArray(pendingUnits) ? pendingUnits.filter(u => (u.isApproved && !u.isAssessmentApproved) || (!u.isApproved && u.isAssessmentApproved)).length : 0) === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                                        <Cpu className="w-10 h-10 text-indigo-200" />
                                        <p className="text-sm font-black uppercase tracking-widest">No partially approved units</p>
                                    </div>
                                ) : (
                                    <motion.div key="partial" className="space-y-4">
                                        {Array.isArray(pendingUnits) && pendingUnits.filter(u => (u.isApproved && !u.isAssessmentApproved) || (!u.isApproved && u.isAssessmentApproved)).map((unit, i) => (
                                            <motion.div
                                                key={unit._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl hover:border-indigo-200 transition-all"
                                            >
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <p className="text-sm font-black text-slate-900 truncate">{getModuleLabel(unit)}</p>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className="px-2 py-0.5 bg-white border border-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase">
                                                            {unit.isApproved ? 'Lesson Done' : 'Assessment Done'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complexity: {unit.complexity}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col space-y-2 border-l border-indigo-100 pl-4">
                                                    {!unit.isApproved && (
                                                        <button
                                                            onClick={() => handleApprove(unit._id, 'lesson')}
                                                            disabled={actionLoading === `${unit._id}-lesson`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 w-full justify-center"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            <span>Approve Lesson</span>
                                                        </button>
                                                    )}
                                                    {!unit.isAssessmentApproved && (
                                                        <button
                                                            onClick={() => handleApprove(unit._id, 'assessment')}
                                                            disabled={actionLoading === `${unit._id}-assessment`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 w-full justify-center"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            <span>Approve Assessment ({unit.quiz_questions?.length || 0})</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* Approved Content Tab */}
                        {activeTab === 'approved' && (
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin mr-3" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : approvedUnits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                                        <CheckCircle className="w-10 h-10 text-slate-200" />
                                        <p className="text-sm font-black uppercase tracking-widest">No fully approved units found</p>
                                    </div>
                                ) : (
                                    <motion.div key="approved" className="space-y-4">
                                        {approvedUnits.map((unit, i) => (
                                            <motion.div
                                                key={unit._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl hover:border-emerald-200 transition-all"
                                            >
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <p className="text-sm font-black text-slate-900 truncate">
                                                        {getModuleLabel(unit)}
                                                    </p>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-white border border-emerald-200 text-emerald-700">
                                                            {unit.complexity}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Fully Active
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleRevoke(unit._id, 'lesson')}
                                                        disabled={actionLoading?.includes(unit._id)}
                                                        className="px-3 py-1.5 border border-red-200 text-[9px] font-black uppercase tracking-widest text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                                    >
                                                        Revoke Lesson
                                                    </button>
                                                    <button
                                                        onClick={() => handleRevoke(unit._id, 'assessment')}
                                                        disabled={actionLoading?.includes(unit._id)}
                                                        className="px-3 py-1.5 border border-indigo-200 text-[9px] font-black uppercase tracking-widest text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                                    >
                                                        Revoke Assessment
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* Students Tab */}
                        {activeTab === 'students' && (
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin mr-3" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                                        <Users className="w-10 h-10 text-slate-300" />
                                        <p className="text-sm font-black uppercase tracking-widest">No learners registered yet</p>
                                    </div>
                                ) : (
                                    <motion.div key="students" className="space-y-3">
                                        {students.map((student, i) => (
                                            <motion.div
                                                key={student._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => handleViewIntelligence(student._id)}
                                                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-black group-hover:scale-110 transition-transform">
                                                        {student.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{student.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{student.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4 text-right">
                                                    <div className="hidden sm:block">
                                                        <p className="text-xs font-black text-slate-900">{student.xp_points ?? 0} XP</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {student.preferred_learning_style?.replace('_', '/') || 'No style set'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right border-l border-slate-200 pl-4">
                                                        <p className="text-xs font-black text-slate-900">{Math.round((student.retention_score || 0) * 100)}%</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Retention</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </main>
            
            {/* Student Intelligence Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => { setSelectedStudent(null); setIntelligenceData(null); }}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                                        {intelligenceData?.user?.name?.[0].toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{intelligenceData?.user?.name || 'Loading Learner...'}</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Cognitive History & Neural Profile</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setSelectedStudent(null); setIntelligenceData(null); }}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {intelligenceLoading ? (
                                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                         <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
                                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Synaptic Logs...</p>
                                    </div>
                                ) : intelligenceData ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        
                                        {/* Left: Intelligence Summary & RL Progress */}
                                        <div className="lg:col-span-7 space-y-10">
                                            
                                            {/* RL Progress (Timing Engine) */}
                                            <section className="space-y-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                                        <Clock className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Timing Engine Matrix (Forgetting Curve)</h3>
                                                </div>
                                                
                                                {intelligenceData.rlVitals?.timing ? (
                                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapped State: {JSON.stringify(intelligenceData.rlVitals.timing.state_key)}</span>
                                                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest hidden sm:block">Active Map</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            {intelligenceData.rlVitals.timing.q_values.map((val, i) => (
                                                                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center group cursor-default">
                                                                    <p className="text-sm font-black text-slate-900">{val.toFixed(3)}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{intelligenceData.rlVitals.timing.actions[i]}</p>
                                                                    {val === Math.max(...intelligenceData.rlVitals.timing.q_values) && val > 0 && (
                                                                        <div className="mt-2 text-[8px] text-indigo-600 font-black uppercase tracking-widest flex items-center justify-center">
                                                                            <Zap className="w-2.5 h-2.5 mr-1" /> Recommendation
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                                                        <p className="text-xs text-amber-900 font-bold italic">Neural Matrix Unavailable. Ensure ML Service is reachable.</p>
                                                    </div>
                                                )}
                                            </section>

                                            {/* RL Progress (Content Modality) */}
                                            <section className="space-y-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                                        <Brain className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Content Modality AI (V.A.R.K Preference)</h3>
                                                </div>
                                                
                                                {intelligenceData.rlVitals?.content ? (
                                                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-4">
                                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center space-x-2 ${
                                                                intelligenceData.rlVitals?.selection_logic === 'Exploration' 
                                                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                            }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${intelligenceData.rlVitals?.selection_logic === 'Exploration' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                                <span>AI Mode: {intelligenceData.rlVitals?.selection_logic || 'Policy'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mb-6">
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">State Vector Vitals</h4>
                                                                <span className="text-[9px] font-bold text-slate-400 font-mono">MAP: {JSON.stringify(intelligenceData.rlVitals?.content?.state_key || [])}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-8">
                                                            {(intelligenceData.rlVitals?.content?.q_values || []).map((val, i) => (
                                                                <div key={i} className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-sm text-center relative group hover:border-primary-200 transition-all">
                                                                    <p className="text-sm font-black text-slate-900 mb-1">{val?.toFixed(3) || "0.000"}</p>
                                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter truncate">{intelligenceData.rlVitals?.content?.actions?.[i] || "Modality"}</p>
                                                                    {val === Math.max(...(intelligenceData.rlVitals?.content?.q_values || [0])) && (
                                                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-primary-600 text-white text-[6px] sm:text-[7px] font-black uppercase tracking-widest rounded shadow-lg whitespace-nowrap">
                                                                            WINNER
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Strategic Trend Matrix Grid */}
                                                        {intelligenceData.rlVitals?.strategy_matrix && (
                                                            <div className="border-t border-slate-200/50 pt-6">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Neural Strategy Matrix (4-Modality View)</p>
                                                                
                                                                <div className="overflow-x-auto overflow-y-hidden border border-slate-100 rounded-2xl">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-slate-50/50">
                                                                            <th className="p-3 text-[7px] font-black text-slate-400 uppercase border-b border-r border-slate-100">Cognitive State (Ret / Time)</th>
                                                                                {(intelligenceData.rlVitals?.content?.actions || []).map(action => (
                                                                                    <th key={action} className="p-3 text-[7px] font-black text-slate-400 uppercase border-b border-slate-100 text-center">{action?.replace('_', '/')}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(intelligenceData.rlVitals?.strategy_matrix || []).map((row, idx) => (
                                                                                <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                                                                                    <td className="p-3 border-b border-r border-slate-100">
                                                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase">{row?.retention_bucket} RETENTION</span>
                                                                <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{row?.time_bucket} WINDOW</span>
                                                            </div>
                                                                                    </td>
                                                                                    {(row?.scores || []).map((score, sIdx) => (
                                                                                        <td key={sIdx} className={`p-3 border-b border-slate-100 text-center transition-all ${sIdx === row?.best_idx ? 'bg-primary-50/50' : ''}`}>
                                                                                            <div className="flex flex-col items-center">
                                                                                                <span className={`text-[9px] font-black ${sIdx === row?.best_idx ? 'text-primary-700' : 'text-slate-400'}`}>
                                                                                                    {score?.toFixed(3) || "0.000"}
                                                                                                </span>
                                                                                                {sIdx === row?.best_idx && (
                                                                                                    <span className="text-[6px] font-black text-primary-500 uppercase mt-0.5 animate-pulse">Winner</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                <p className="mt-4 text-[8px] text-slate-400 italic leading-relaxed">
                                                                    * Matrix shows AI confidence across all 4 modalities for different performance tiers. 
                                                                    Global winner at each level is highlighted in <b>Primary Blue</b>.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                                                        <p className="text-xs text-slate-400 font-bold">Modality Matrix Offline</p>
                                                    </div>
                                                )}
                                            </section>

                                            {/* Key Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100">
                                                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Stability Factor</p>
                                                    <p className="text-2xl font-black text-primary-900">{Math.round((intelligenceData.user?.retention_score || 0) * 100)}%</p>
                                                </div>
                                                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Experience Total</p>
                                                    <p className="text-2xl font-black text-white">{intelligenceData.user?.xp_points || 0} XP</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Interaction Path (History) */}
                                        <div className="lg:col-span-5 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg">
                                                        <Users className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Interaction Path</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last 50 Events</span>
                                            </div>

                                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(intelligenceData.interactions || [])?.length > 0 ? (
                                                    intelligenceData.interactions.map((event, idx) => (
                                                        <div key={event?._id || idx} className="relative pl-10 pb-2 group">
                                                            {/* Vertical line connector */}
                                                            {idx !== (intelligenceData.interactions || []).length - 1 && (
                                                                <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-slate-100 group-hover:bg-primary-100 transition-colors" />
                                                            )}
                                                            
                                                            {/* Dot */}
                                                            <div className={`absolute left-[0.7rem] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-white transition-all group-hover:scale-125 ${
                                                                (event?.quiz_result || 0) >= 0.7 ? 'border-emerald-500' :
                                                                (event?.quiz_result || 0) >= 0.4 ? 'border-amber-500' : 'border-red-500'
                                                            }`} />

                                                            <div className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-slate-200 hover:shadow-md transition-all">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                                            {event?.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Syncing...'} at {event?.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                                        </p>
                                                                        <p className="text-xs font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                                                            {(event?.actual_modality || event?.module_type || 'Sync Event').replace('_', ' ')}
                                                                        </p>
                                                                    </div>
                                                                     <div className="text-right">
                                                                        <p className={`text-xs font-black ${
                                                                            (event?.quiz_result || 0) >= 0.7 ? 'text-emerald-600' :
                                                                            (event?.quiz_result || 0) >= 0.4 ? 'text-amber-600' : 'text-red-600'
                                                                        }`}>
                                                                            {Math.round((event?.quiz_result || 0) * 100)}%
                                                                        </p>
                                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Accuracy</p>
                                                                    </div>
                                                                </div>

                                                                {/* High-Fidelity Focus Breakdown */}
                                                                {event?.time_spent && Object.values(event.time_spent || {}).some(v => v > 0) && (
                                                                    <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                                                                        {Object.entries(event.time_spent || {}).map(([mod, sec]) => (sec || 0) > 0 && (
                                                                            <div key={mod} className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                                                    mod === 'video' ? 'bg-indigo-500' :
                                                                                    mod === 'audio' ? 'bg-amber-500' :
                                                                                    mod === 'read_write' ? 'bg-emerald-500' : 'bg-rose-500'
                                                                                }`} />
                                                                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">
                                                                                    {(mod || 'unknown')?.replace('_', '/')}: {(sec || 0) < 60 ? `${sec}s` : `${Math.floor(sec/60)}m ${sec%60}s`}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No interactions recorded</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Real-time Cognitive Synchronization</span>
                                <span>LearnFlow ML v2.4.0</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-6 right-6 flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-black uppercase tracking-widest z-50 ${
                            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
                        }`}
                    >
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        <span>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
