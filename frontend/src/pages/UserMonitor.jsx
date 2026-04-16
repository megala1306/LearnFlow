import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ChevronRight, Award, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const UserMonitor = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // We'll add this endpoint to the admin route
                const res = await apiClient.get('/admin/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Error fetching users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-primary-600 animate-pulse" />
            </div>
            <p className="text-primary-600 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Scanning Network for Users...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 lg:p-16 relative overflow-hidden selection:bg-primary-500/10">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh-gradient" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-16 relative z-10"
            >
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
                    <div className="space-y-6">
                        <div
                            onClick={() => navigate('/admin')}
                            className="group flex items-center text-slate-400 hover:text-primary-600 transition-all text-[10px] font-black uppercase tracking-[0.3em] cursor-pointer"
                        >
                            <Shield className="w-4 h-4 mr-3" />
                            Registry Authority
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.8] italic">Registry<span className="text-primary-600">.</span></h1>
                    </div>

                    <div className="relative w-full xl:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            placeholder="Search Users..."
                            className="w-full h-16 bg-white/70 border border-white/40 rounded-2xl pl-16 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:border-primary-300 outline-none transition-all backdrop-blur-xl shadow-lg"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white/70 border border-white/40 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">User Identity</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Fidelity Score</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Experience</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-right">Fidelity Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="group hover:bg-slate-50/50 transition-colors relative">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center space-x-6">
                                                <div className="relative">
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:border-primary-200 group-hover:bg-primary-50 transition-all duration-500 shadow-sm">
                                                        <Users className="w-6 h-6 text-slate-400 group-hover:text-primary-600 transition-colors" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 text-xl italic tracking-tight">{user.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                <Award className="w-4 h-4 text-indigo-600 mr-2" />
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Rank {user.level || 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center space-x-3">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                <span className="text-lg font-black text-slate-900 italic">{user.xp_points || 0} <span className="text-[10px] text-slate-400 not-italic ml-1">XP</span></span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="inline-block relative">
                                                <span className={`text-4xl font-black italic tracking-tighter ${user.retention_score > 0.7 ? 'text-emerald-600' : 'text-primary-600'}`}>
                                                    {((user.retention_score || 0) * 100).toFixed(0)}%
                                                </span>
                                                <div className={`absolute -bottom-1 left-0 w-full h-1 rounded-full ${user.retention_score > 0.7 ? 'bg-emerald-100' : 'bg-primary-100'}`} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Registry Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
                    {[
                        { label: 'Registered Users', value: users.length, icon: Shield, color: 'text-primary-600', bg: 'bg-primary-50' },
                        { label: 'Network Stability', value: '99.9%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Uplink Fidelity', value: 'Nominal', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/70 border border-white/40 p-8 rounded-[2rem] flex items-center justify-between group hover:border-primary-100 transition-all shadow-xl backdrop-blur-xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 italic">{stat.value}</p>
                            </div>
                            <div className={`p-4 ${stat.bg} rounded-2xl ${stat.color}`}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default UserMonitor;
