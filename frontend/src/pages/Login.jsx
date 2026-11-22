import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      loginUser(res.data.token, res.data.user);
      if (res.data.user.role === 'DOCTOR') navigate('/doctor');
      else if (res.data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-2.5 rounded-xl backdrop-blur-sm">
            <Activity size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">MediQueue Smart OPD</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Zero-Wait Hospital Queue & Token Management.
          </h1>
          <p className="text-teal-100 text-base leading-relaxed">
            Real-time WebSocket queue tracking, instant QR boarding passes, emergency triage prioritization, and live lobby displays.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15">
            <div>
              <p className="text-2xl font-extrabold">Live</p>
              <p className="text-xs text-teal-200">Socket.io Sync</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">QR</p>
              <p className="text-xs text-teal-200">Instant Check-In</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">3 Roles</p>
              <p className="text-xs text-teal-200">Patient / Doc / Admin</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-teal-200/70">UG Engineering Major Project • Healthcare Web Application</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to Portal</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Enter your registered email and password</p>

          {error && (
            <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? 'Signing in...' : <>Continue to Dashboard <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="text-sm text-center text-slate-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal-600 font-bold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
