import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginService } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();
  const { login: authLogin } = useAuth();
  const { showNotification } = useNotification();

  // Quick focus on mount for cashier efficiency
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector('input[name="email"]')?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { token, user } = await loginService(form.email, form.password);
      authLogin(user, token);
      showNotification(`Welcome back, ${user.fullName || 'User'}!`, 'success');
      nav("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
      </div>

      <div className="max-w-[460px] w-full relative z-10">
        {/* Main Container with 1px Gradient Border */}
        <div className="relative bg-[#0d0d0f]/90 backdrop-blur-3xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] before:absolute before:inset-0 before:rounded-[2.5rem] before:p-[1px] before:bg-gradient-to-br before:from-white/10 before:via-white/[0.02] before:to-transparent before:-z-10 overflow-hidden">
          
          {/* Brand Header */}
          <div className="text-center mb-12">
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-accent rounded-3xl blur-2xl opacity-10" />
              <div className="relative w-22 h-22 bg-[#0a0a0c] rounded-[2rem] flex items-center justify-center border border-white/[0.05] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden">
                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">S</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-accent text-white p-2 rounded-xl shadow-2xl border border-dark-900 animate-bounce-subtle">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              Samoke <span className="text-accent">Valley</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-6 bg-white/[0.03]" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] leading-none">Terminal Access</p>
              <div className="h-[1px] w-6 bg-white/[0.03]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Cashier Identity Input */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">Email</label>
              <div className="relative group">
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isFocused === 'email' ? 'bg-accent/10 text-accent' : 'bg-dark-950/30 text-gray-600 group-hover:text-gray-400'}`}>
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Email" 
                  required 
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused('')}
                  onChange={handleChange}
                  className={`w-full bg-[#0a0a0c] border transition-all duration-500 text-white pl-18 pr-6 py-5 rounded-2xl outline-none placeholder:text-gray-700 font-bold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                    isFocused === 'email' ? 'border-accent shadow-[0_0_20px_rgba(234,88,12,0.15)]' : 'border-white/[0.03] group-hover:border-white/[0.08]'
                  }`}
                />
              </div>
            </div>
            
            {/* Security Pass Input */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">Password</label>
              <div className="relative group">
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isFocused === 'password' ? 'bg-accent/10 text-accent' : 'bg-dark-950/30 text-gray-600 group-hover:text-gray-400'}`}>
                  <LockClosedIcon className="w-5 h-5" />
                </div>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Access Code" 
                  required 
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused('')}
                  onChange={handleChange}
                  className={`w-full bg-[#0a0a0c] border transition-all duration-500 text-white pl-18 pr-14 py-5 rounded-2xl outline-none placeholder:text-gray-700 font-bold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ${
                    isFocused === 'password' ? 'border-accent shadow-[0_0_20px_rgba(234,88,12,0.15)]' : 'border-white/[0.03] group-hover:border-white/[0.08]'
                  }`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-5">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full relative py-5 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden group/btn ${
                  loading 
                  ? "bg-dark-950 text-gray-600 cursor-not-allowed border border-white/5" 
                  : "bg-gradient-to-r from-accent to-orange-600 text-white shadow-[0_15px_30px_rgba(234,88,12,0.3)] hover:shadow-[0_20px_40px_rgba(234,88,12,0.4)] hover:-translate-y-1 active:scale-95"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Establish Session</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
              </button>
            </div>
          </form>

          {/* Terminal Info Footer */}
          <div className="mt-12 pt-8 border-t border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-dark-950/40 rounded-xl border border-white/[0.03]">
              <CpuChipIcon className="w-4 h-4 text-gray-500" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">NODE: v1.0.4-S</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-dark-950/40 rounded-xl border border-white/[0.03]">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
                <div className="relative w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">System Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}