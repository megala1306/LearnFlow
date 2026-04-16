import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Video, Headphones, BookText, Code, Rocket, ChevronRight, Sparkles } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const DiagnosticSurvey = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState({
        preferred_learning_style: 'read_write',
        learning_speed: 'medium'
    });

    const steps = [
        {
            id: 1,
            title: "Learning Modality",
            question: "How do you absorb information most effectively?",
            options: [
                { id: 'video', label: 'Visual', desc: 'I watch animations & diagrams', icon: Video, color: 'text-blue-500' },
                { id: 'audio', label: 'Auditory', desc: 'I listen to explanations', icon: Headphones, color: 'text-purple-500' },
                { id: 'read_write', label: 'Read/Write', desc: 'I read text & take notes', icon: BookText, color: 'text-emerald-500' },
                { id: 'kinesthetic', label: 'Kinesthetic', desc: 'I learn by writing code', icon: Code, color: 'text-orange-500' }
            ]
        },
        {
            id: 2,
            title: "Cognitive Velocity",
            question: "At what pace do you prefer to progress through new concepts?",
            options: [
                { id: 'slow', label: 'Methodical', desc: 'Step-by-step deep dives', icon: Brain, color: 'text-slate-500' },
                { id: 'medium', label: 'Balanced', desc: 'Normal academic flow', icon: Sparkles, color: 'text-primary-500' },
                { id: 'fast', label: 'Accelerated', desc: 'High-speed concept sync', icon: Rocket, color: 'text-indigo-500' }
            ]
        }
    ];

    const currentStep = steps.find(s => s.id === step);

    const handleSelect = (id) => {
        if (step === 1) {
            setPreferences({ ...preferences, preferred_learning_style: id });
        } else {
            setPreferences({ ...preferences, learning_speed: id });
        }
    };

    const handleNext = async () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            try {
                const res = await apiClient.post('/auth/diagnostic', preferences);
                if (res.data.user) {
                    setUser(res.data.user);
                    sessionStorage.setItem('user', JSON.stringify(res.data.user));
                    navigate('/courses');
                }
            } catch (err) {
                console.error("Diagnostic sync failed:", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12">
            <div className="max-w-4xl w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="glass-card p-12 md:p-16 rounded-[3rem] relative overflow-hidden"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${(step / steps.length) * 100}%` }}
                                className="h-full bg-primary-600"
                            />
                        </div>

                        <div className="space-y-12">
                            <header className="space-y-4">
                                <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary-50 rounded-xl border border-primary-100">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600">
                                        Phase {step} of {steps.length}: {currentStep.title}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                                    {currentStep.question}
                                </h1>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {currentStep.options.map((option) => (
                                    <motion.div
                                        key={option.id}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(option.id)}
                                        className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${(step === 1 ? preferences.preferred_learning_style : preferences.learning_speed) === option.id
                                            ? 'border-primary-600 bg-primary-50 shadow-xl shadow-primary-600/10'
                                            : 'border-slate-100 bg-white hover:border-primary-200'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-6">
                                            <div className={`w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm ${option.color}`}>
                                                <option.icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 uppercase italic tracking-tight">{option.label}</h3>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{option.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <footer className="pt-8 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    className="px-10 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary-600/30 flex items-center space-x-4 hover:bg-primary-500 transition-all active:scale-95 group"
                                >
                                    <span>{step === steps.length ? "Synchronize Patterns" : "Next Protocol"}</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </footer>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DiagnosticSurvey;
