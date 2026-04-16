import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Sparkles, ArrowRight, Zap, GraduationCap, Shield } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/courses');
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 
                           (err.message === "Network Error" ? "Unable to connect to server" : "Registration failed. Please try again.");
            setError(errorMsg);
        }
    };

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-slate-50 selection:bg-emerald-500/10">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] -right-[10%] w-[700px] h-[700px] bg-emerald-100/40 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[-20%] -left-[10%] w-[600px] h-[600px] bg-green-100/40 rounded-full blur-[140px] animate-pulse delay-700" />

                {/* SVG Dot Matrix Overlay */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="relative bg-white/70 backdrop-blur-3xl border border-white/40 p-6 md:p-8 space-y-4 overflow-hidden rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                    {/* Top Glow Accent */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-100 rounded-full blur-[80px]" />

                    {/* Header */}
                    <div className="space-y-3 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 mx-auto mb-2 relative group"
                        >
                            <GraduationCap className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                        </motion.div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-emerald-600 bg-clip-text text-transparent tracking-tighter uppercase italic leading-[1.1] pb-1">Start Your <br /><span className="text-emerald-600">Journey</span></h1>
                        <p className="text-emerald-600/60 font-black text-[8px] uppercase tracking-[0.4em]">Personalized Learning Platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ x: 20, opacity: 0, scale: 0.95 }}
                                    animate={{ x: 0, opacity: 1, scale: 1 }}
                                    exit={{ x: -20, opacity: 0, scale: 0.95 }}
                                    className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black flex items-center shadow-sm"
                                >
                                    <Shield className="w-4 h-4 mr-3 shrink-0" />
                                    <span className="uppercase tracking-widest">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="group space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-emerald-600 transition-colors">Your Name</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full h-16 pl-16 pr-8 bg-white border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-emerald-600 transition-colors">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="your.email@learnflow.io"
                                        className="w-full h-16 pl-16 pr-8 bg-white border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-emerald-600 transition-colors">Secure Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full h-16 pl-16 pr-8 bg-white border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all outline-none"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center space-x-4 shadow-xl shadow-emerald-600/20 transition-all group"
                        >
                            <span>Create Account</span>
                            <Zap className="w-4 h-4 fill-white group-hover:scale-125 transition-transform" />
                        </motion.button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 text-center flex flex-col items-center space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Already have an account? <br className="sm:hidden" />
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-black ml-1 transition-colors inline-block">
                                Signature Log In
                            </Link>
                        </p>

                        {/* Status tag */}
                        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 opacity-60">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest">Global Network Ready</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
