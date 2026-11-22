import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Activity, CalendarCheck, Stethoscope, ShieldCheck, Tv, LogOut, UserCircle2, Ticket } from 'lucide-react';
import PatientBooking from './pages/PatientBooking';
import MyTokens from './pages/MyTokens';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminPanel from './pages/AdminPanel';
import LobbyScreen from './pages/LobbyScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function Navbar() {
  const { user, logoutUser } = useAuth();
  const location = useLocation();

  if (location.pathname === '/lobby') return null;

  const navLinkClass = (path) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
      location.pathname === path
        ? 'bg-teal-50 text-teal-700 font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-teal-600 to-emerald-500 text-white p-2 rounded-xl shadow-sm">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">MediQueue</span>
            <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              OPD Live
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/lobby" target="_blank" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition">
            <Tv size={16} /> Lobby TV
          </Link>

          {user?.role === 'PATIENT' && (
            <>
              <Link to="/" className={navLinkClass('/')}>
                <CalendarCheck size={16} /> New Booking
              </Link>
              <Link to="/my-tokens" className={navLinkClass('/my-tokens')}>
                <Ticket size={16} /> My Tokens
              </Link>
            </>
          )}
          {user?.role === 'DOCTOR' && (
            <Link to="/doctor" className={navLinkClass('/doctor')}>
              <Stethoscope size={16} /> Doctor Console
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin" className={navLinkClass('/admin')}>
                <ShieldCheck size={16} /> Reception & Admin
              </Link>
              <Link to="/doctor" className={navLinkClass('/doctor')}>
                <Stethoscope size={16} /> Doctor View
              </Link>
              <Link to="/" className={navLinkClass('/')}>
                <CalendarCheck size={16} /> Booking View
              </Link>
            </>
          )}

          {!user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700">
                Sign In
              </Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl shadow-sm hover:bg-teal-700 transition">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-200">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <UserCircle2 size={16} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-2xs">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logoutUser}
                title="Logout"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/lobby" element={<LobbyScreen />} />
              <Route path="/" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}><PatientBooking /></ProtectedRoute>} />
              <Route path="/my-tokens" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}><MyTokens /></ProtectedRoute>} />
              <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
