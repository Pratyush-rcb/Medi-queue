import { useState, useEffect } from 'react';
import { api, socket } from '../api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Ticket, UserCheck, Stethoscope, Building2, Sparkles, PlusCircle } from 'lucide-react';

export default function PatientBooking() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [ticket, setTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get('/doctors')
      .then((res) => {
        setDoctors(res.data);
        if (res.data.length > 0 && !selectedDoc) {
          setSelectedDoc(res.data[0]._id);
        }
      })
      .catch((err) => setError('Cannot load doctors: ' + (err.response?.data?.message || err.message)));
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;
    api.get(`/queue/${selectedDoc}/${today}`)
      .then((res) => setQueue(res.data))
      .catch(() => {});

    const eventName = `queue_update_${selectedDoc}`;
    socket.on(eventName, (updatedQueue) => setQueue(updatedQueue));
    return () => socket.off(eventName);
  }, [selectedDoc, today]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedDoc) {
      setError('Please select a doctor first.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/appointments', {
        patientName,
        patientPhone,
        doctorId: selectedDoc,
        date: today,
      });
      setTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking failed');
      if (err.response?.data?.existingToken) {
        setTicket(err.response.data.existingToken);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeDoc = doctors.find((d) => d._id === selectedDoc);
  const nowServing = queue.find((q) => q.status === 'IN_CONSULTATION');
  const waitingList = queue.filter((q) => q.status === 'WAITING');

  const activeUserToken = queue.find(
    (q) =>
      q.patientPhone === patientPhone.trim() &&
      (q.status === 'WAITING' || q.status === 'IN_CONSULTATION')
  );
  const displayedTicket = ticket || activeUserToken;

  const waitingAhead = displayedTicket
    ? queue.filter(
        (q) =>
          q.status === 'WAITING' &&
          (q.isEmergency || q.tokenNumber < displayedTicket.tokenNumber)
      ).length
    : waitingList.length;

  const estWait = waitingAhead * (activeDoc?.avgConsultationMinutes || 10);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">OPD Appointment & Live Queue</h1>
          <p className="text-sm text-slate-500">Select a specialist to check live waiting status or generate your instant token pass.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 self-start">
          Date: {today}
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Stethoscope size={20} className="text-teal-600" /> Choose Specialist & Patient Info
          </h2>

          {error && (
            <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Available OPD Doctors
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => { setSelectedDoc(doc._id); setTicket(null); setError(''); }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedDoc === doc._id
                        ? 'border-teal-600 bg-teal-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-900">{doc.name}</p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Rm {doc.roomNumber}
                      </span>
                    </div>
                    <p className="text-xs text-teal-700 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 size={12} /> {doc.department}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">~{doc.avgConsultationMinutes} mins / patient</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Patient Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || doctors.length === 0 || (user?.role === 'PATIENT' && Boolean(activeUserToken))}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles size={18} />
              {user?.role === 'PATIENT' && activeUserToken
                ? `Active Token #${activeUserToken.tokenNumber} Already Issued`
                : loading
                ? 'Generating Token...'
                : 'Generate Digital Queue Token'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" /> Live Clinic Status
              </span>
              <span className="text-xs text-slate-400">{activeDoc?.name || 'Select Doctor'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-300">Now Serving</p>
                <p className="text-2xl font-black text-teal-400 mt-0.5">
                  {nowServing ? `#${nowServing.tokenNumber}` : '--'}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-300">In Waiting</p>
                <p className="text-2xl font-black text-white mt-0.5">{waitingList.length}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[11px] text-slate-300">Est. Wait</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">{estWait}m</p>
              </div>
            </div>
          </div>

          {displayedTicket && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} />
                  <span className="font-bold text-sm">OPD Digital Pass</span>
                </div>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                  Room {activeDoc?.roomNumber}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-dashed border-slate-300">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Your Token</p>
                    <h3 className="text-5xl font-black text-slate-900 mt-1">#{displayedTicket.tokenNumber}</h3>
                    <p className="text-sm font-semibold text-slate-700 mt-2">{displayedTicket.patientName}</p>
                    <p className="text-xs text-slate-500">{activeDoc?.name} • {activeDoc?.department}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <QRCodeSVG value={displayedTicket._id} size={110} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="bg-teal-50 p-3 rounded-xl">
                    <p className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                      <Ticket size={14} /> Ahead of You
                    </p>
                    <p className="text-xl font-extrabold text-teal-950 mt-0.5">{waitingAhead} patients</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                      <Clock size={14} /> Expected Wait
                    </p>
                    <p className="text-xl font-extrabold text-amber-950 mt-0.5">{estWait} mins</p>
                  </div>
                </div>

                {!activeUserToken && (
                  <button
                    onClick={() => setTicket(null)}
                    className="w-full mt-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <PlusCircle size={14} /> Book Another Token
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}