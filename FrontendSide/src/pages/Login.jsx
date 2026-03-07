import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginService } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login: authLogin } = useAuth();
  const { showNotification } = useNotification();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await loginService(form.email, form.password);
      authLogin(user, token);
      showNotification(`Welcome back, ${user.name || 'User'}!`, 'success');
      nav("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-800 p-8 rounded-xl shadow-2xl border border-dark-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/20 text-accent mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-text-secondary mt-2">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Email Address</label>
            <input 
              name="email" 
              type="email" 
              placeholder="admin@pos.com" 
              required 
              className="w-full bg-dark-700 border border-dark-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder-text-muted"
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full bg-dark-700 border border-dark-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder-text-muted"
              onChange={handleChange} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-lg shadow-lg shadow-accent/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}