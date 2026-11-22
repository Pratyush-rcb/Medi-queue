import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, socket } from '../api';
import { CheckCircle2, Clock, Building2, User, ArrowLeft, AlertCircle, Pill } from 'lucide-react';

export default function VerifyToken() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTokenStatus = () => {
    api.get(`/appointments/${id}/verify`)
      .then((res) => {
        setData(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to verify token');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTokenStatus();
    socket.on('lobby_update', fetchTokenStatus);
    return () => socket.off('lobby_update', fetchTokenStatus);
  }, [id]);

  if (loading) {
    return <div className="max-w-lg mx-auto p-8 text-slate-500 font-medium">Verifying digital OPD token...</div>;
  }

  if (error || !data?.appointment) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-3 text-center">
          <AlertCircle className="mx-auto text-red-600" size={32} />
          <h1 className="text-lg font-extrabold text-slate-900">Token Verification Failed</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <Link to="/lobby" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline pt-2">
            <ArrowLeft size={14} /> Go to Live Lobby
          </Link>
        </div>
      </div>
    );
  }

  const { appointment: appt, aheadCount } = data;

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
            <CheckCircle2 size={17} /> Verified Digital Boarding Pass
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            appt.status === 'IN_CONSULTATION' ? 'bg-teal-600 text-white' :
            appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
            appt.status === 'NO_SHOW' ? 'bg-slate-200 text-slate-600' :
            'bg-amber-100 text-amber-800'
          }`}>
            {appt.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Token Number</p>
            <p className="text-5xl font-black text-slate-900">#{appt.tokenNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold text-slate-400">Patients Ahead</p>
            <p className="text-2xl font-black text-teal-700">
              {appt.status === 'WAITING' ? aheadCount : 0}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-200">
          <p className="font-bold text-slate-900 flex items-center gap-2">
            <User size={15} className="text-slate-500" /> {appt.patientName}
          </p>
          <p className="text-slate-700 font-semibold">{appt.doctorId?.name}</p>
          <p className="text-xs text-teal-700 font-medium flex items-center gap-1.5">
            <Building2 size={14} /> {appt.doctorId?.department} • Room {appt.doctorId?.roomNumber}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={14} /> Scheduled Date: {appt.date}
          </p>
        </div>

        {appt.prescription?.diagnosis && (
          <div className="bg-teal-50/70 rounded-xl p-4 space-y-2 border border-teal-200 text-xs">
            <p className="font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <Pill size={14} className="text-teal-700" /> Issued Prescription Summary
            </p>
            <p className="font-bold text-slate-900 text-sm">{appt.prescription.diagnosis}</p>
            {appt.prescription.advice && (
              <p className="text-slate-700 leading-relaxed">{appt.prescription.advice}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link to="/lobby" className="text-xs font-bold text-teal-700 hover:underline">
            Open Live Lobby Board →
          </Link>
          <Link to="/my-tokens" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            My Tokens
          </Link>
        </div>
      </div>
    </div>
  );
}