
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
  Fingerprint,
  Eye,
  EyeOff,
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(email, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/courses');
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Authentication failed. Please check credentials."
      );
    }
  };

  const mailIconClass =
    "absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 " +
    (email ? "text-emerald-600" : "text-slate-300");

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-lg space-y-4">

          {/* HEADER */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-700">
                Premium Adaptive Access
              </span>
            </div>

            <h2 className="text-4xl font-black bg-gradient-to-br from-slate-900 to-emerald-600 bg-clip-text text-transparent uppercase italic leading-tight">
              Welcome <span className="text-emerald-600">Back</span>
            </h2>

            <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">
              Security Protocol Active
            </p>
          </div>

          {/* ERROR MESSAGE */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black flex items-center"
              >
                <Shield className="w-5 h-5 mr-3" />
                <span className="uppercase tracking-widest">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                Identification
              </label>

              <div className="relative">
                <Mail className={mailIconClass} />

                <input
                  type="email"
                  placeholder="your.email@learnflow.io"
                  className="w-full h-16 pl-20 pr-6 bg-white/50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all backdrop-blur-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                Access Key
              </label>

              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-16 pl-20 pr-16 bg-white/50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all backdrop-blur-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-lg uppercase tracking-[0.25em] flex items-center justify-center space-x-3 shadow-xl shadow-emerald-600/20 transition-all"
            >
              <span>Authorize Session</span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>

          </form>

          {/* FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
              New Explorer?
              <Link
                to="/register"
                className="text-slate-900 hover:text-emerald-600 ml-2 underline underline-offset-4"
              >
                Initialize Account
              </Link>
            </p>

            <div className="flex items-center space-x-3 bg-slate-50 px-5 py-2 rounded-xl border border-slate-100 opacity-60 hover:opacity-100">
              <Fingerprint className="w-4 h-4 text-emerald-500" />

              <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Biometric Layer Verified
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;

