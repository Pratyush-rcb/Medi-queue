import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', otp: '',
    role: 'PATIENT', department: '', roomNumber: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: 'PATIENT', label: 'Patient', icon: User },
    { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
    { id: 'ADMIN', label: 'Admin / Desk', icon: ShieldCheck },
  ];

  const handleSendOtp = async () => {
    setError('');
    setInfoMsg('');
    if (!form.email) {
      setError('Please enter your email address first.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', { email: form.email });
      setOtpSent(true);
      setInfoMsg(res.data.message || 'OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/signup', form);
      loginUser(res.data.token, res.data.user);
      if (res.data.user.role === 'DOCTOR') navigate('/doctor');
      else if (res.data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-extrabold text-slate-900">Create your account</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Select your portal role and verify your email via OTP</p>

        {error && (
          <div className="p-3.5 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {infoMsg && (
          <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {roles.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setForm({ ...form, role: id })}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  form.role === id
                    ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input required placeholder="Dr. / Mr. / Ms." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
              <input required placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
              >
                {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">6-Digit OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Enter OTP from email"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input type="password" required placeholder="Create a strong password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>

          {form.role === 'DOCTOR' && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-teal-900 mb-1">Department</label>
                <input required placeholder="e.g. Cardiology" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full bg-white border border-teal-300 rounded-lg p-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-teal-900 mb-1">OPD Room No.</label>
                <input required placeholder="e.g. 102" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="w-full bg-white border border-teal-300 rounded-lg p-2 text-sm outline-none" />
              </div>
            </div>
          )}

          <button disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer">
            {submitting ? 'Creating Account...' : <>Create Account <ArrowRight size={17} /></>}
          </button>
        </form>

        <p className="text-sm text-center text-slate-600 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}