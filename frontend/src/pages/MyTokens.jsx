import { useState, useEffect } from 'react';
import { api, socket } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Pill,
  Stethoscope,
} from 'lucide-react';

export default function MyTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openReportId, setOpenReportId] = useState(null);

  const loadTokens = () => {
    api
      .get('/appointments/my')
      .then((res) => setTokens(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTokens();
    socket.on('lobby_update', loadTokens);
    return () => socket.off('lobby_update', loadTokens);
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-slate-500 font-medium">
        Loading your tokens &amp; reports...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Token &amp; Reports</h1>
        <p className="text-sm text-slate-500">
          Track live queue status, scan QR boarding passes, and view or print consultation reports &amp; prescriptions.
        </p>
      </div>

      {tokens.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          You haven&apos;t booked any OPD tokens yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {tokens.map((t) => {
            const rx = t.prescription || {};
            const hasReport = Boolean(
              rx.diagnosis || rx.symptoms || rx.advice || (rx.medicines && rx.medicines.length > 0)
            );
            const isExpanded = openReportId === t._id;
            const verifyUrl = `${window.location.origin}/verify/${t._id}`;

            return (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-3xl font-black text-slate-900">#{t.tokenNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          t.status === 'IN_CONSULTATION'
                            ? 'bg-teal-600 text-white'
                            : t.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'NO_SHOW'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      {t.isEmergency && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700">
                          EMERGENCY
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-slate-800">{t.doctorId?.name || 'Doctor'}</p>
                    <p className="text-xs text-teal-700 font-medium flex items-center gap-1">
                      <Building2 size={13} /> {t.doctorId?.department || 'OPD'} • Room{' '}
                      {t.doctorId?.roomNumber || '—'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                      <Clock size={12} /> Date: {t.date}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0 text-center">
                    <QRCodeSVG value={verifyUrl} size={96} />
                    <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                      Scan for Live Pass &amp; Rx
                    </p>
                  </div>
                </div>

                {/* Patient Report & Prescription Section */}
                <div className="pt-3 border-t border-slate-100">
                  {hasReport ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenReportId(isExpanded ? null : t._id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-extrabold transition cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FileText size={15} className="text-teal-700" />
                          View Report &amp; Digital Prescription
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              {rx.symptoms && (
                                <p className="text-slate-600">
                                  <span className="font-bold text-slate-800">Reported Symptoms: </span>
                                  {rx.symptoms}
                                </p>
                              )}
                              <div>
                                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                                  <Stethoscope size={12} className="text-teal-600" /> Diagnosis &amp; Report
                                </p>
                                <p className="font-bold text-slate-900 text-sm mt-0.5">
                                  {rx.diagnosis || 'Outpatient consultation completed'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-900 font-bold shrink-0 cursor-pointer"
                            >
                              <Printer size={13} /> Print Report
                            </button>
                          </div>

                          {rx.medicines?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                                <Pill size={12} className="text-teal-600" /> Prescribed Medicines
                              </p>
                              <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 px-3">
                                {rx.medicines.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2 flex justify-between items-center gap-2"
                                  >
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
                              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                                Doctor&apos;s Advice &amp; Follow-up
                              </p>
                              <p className="text-slate-700 mt-0.5 leading-relaxed">{rx.advice}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <FileText size={14} className="text-slate-400" />
                        Report &amp; prescription will appear after consultation
                      </span>
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-teal-700 hover:underline"
                      >
                        Open Pass
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}