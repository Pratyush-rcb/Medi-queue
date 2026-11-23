import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, socket } from '../api';
import {
  CheckCircle2,
  Clock,
  Building2,
  User,
  ArrowLeft,
  AlertCircle,
  Pill,
  Printer,
} from 'lucide-react';

export default function VerifyToken() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTokenStatus = () => {
    api
      .get(`/appointments/${id}/verify`)
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
    return (
      <div className="max-w-xl mx-auto p-8 text-slate-500 font-medium">
        Loading token &amp; report details...
      </div>
    );
  }

  if (error || !data?.appointment) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-3 text-center">
          <AlertCircle className="mx-auto text-red-600" size={32} />
          <h1 className="text-lg font-extrabold text-slate-900">Token Verification Failed</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <Link
            to="/lobby"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline pt-2"
          >
            <ArrowLeft size={14} /> Go to Live Lobby
          </Link>
        </div>
      </div>
    );
  }

  const { appointment: appt, aheadCount = 0 } = data;
  const avgMins = appt.doctorId?.avgConsultationMinutes || 10;
  const estimatedWait = appt.status === 'WAITING' ? aheadCount * avgMins : 0;
  const rx = appt.prescription;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
            <CheckCircle2 size={17} /> Verified Token &amp; Report Pass
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              appt.status === 'IN_CONSULTATION'
                ? 'bg-teal-600 text-white'
                : appt.status === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : appt.status === 'NO_SHOW'
                ? 'bg-slate-200 text-slate-600'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {appt.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 items-baseline bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-400">Token</p>
            <p className="text-4xl font-black text-slate-900">#{appt.tokenNumber}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase font-bold text-slate-400">Ahead</p>
            <p className="text-2xl font-black text-teal-700">
              {appt.status === 'WAITING' ? aheadCount : 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase font-bold text-slate-400">Est. Wait</p>
            <p className="text-xl font-black text-amber-700">
              {appt.status === 'WAITING' ? `~${estimatedWait} min` : '—'}
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

        {rx?.diagnosis || (rx?.medicines && rx.medicines.length > 0) || rx?.advice ? (
          <div className="bg-teal-50/70 rounded-xl p-4 space-y-3 border border-teal-200 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <Pill size={14} className="text-teal-700" /> Consultation Report &amp; Prescription
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-bold cursor-pointer"
              >
                <Printer size={12} /> Print
              </button>
            </div>

            {rx.diagnosis && (
              <div>
                <p className="text-[11px] font-bold uppercase text-teal-800/70">Diagnosis</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{rx.diagnosis}</p>
              </div>
            )}

            {rx.medicines?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase text-teal-800/70">Medicines</p>
                <div className="bg-white rounded-lg border border-teal-200/80 divide-y divide-slate-100 px-3">
                  {rx.medicines.map((m, i) => (
                    <div key={i} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-slate-500">
                          {m.dosage} • {m.frequency}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold shrink-0">
                        {m.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rx.advice && (
              <div>
                <p className="text-[11px] font-bold uppercase text-teal-800/70">Advice</p>
                <p className="text-slate-700 leading-relaxed mt-0.5">{rx.advice}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            No consultation report or prescription issued yet for this token.
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link to="/lobby" className="text-xs font-bold text-teal-700 hover:underline">
            Open Live Lobby Board →
          </Link>
          <Link to="/my-tokens" className="text-xs font-bold text-slate-600 hover:text-slate-900">
            My Token &amp; Reports
          </Link>
        </div>
      </div>
    </div>
  );
}