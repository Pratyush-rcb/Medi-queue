import { useState, useEffect } from 'react';
import { api } from '../api';
import { UserPlus, Siren, CheckCircle2, Stethoscope } from 'lucide-react';

export default function AdminPanel() {
  const [doctors, setDoctors] = useState([]);
  const [docForm, setDocForm] = useState({ name: '', department: '', roomNumber: '', avgConsultationMinutes: 10 });
  const [walkIn, setWalkIn] = useState({ patientName: '', patientPhone: '', doctorId: '', isEmergency: false });
  const [msg, setMsg] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const loadDoctors = () => {
    api.get('/doctors').then((res) => {
      setDoctors(res.data);
      if (res.data.length > 0 && !walkIn.doctorId) {
        setWalkIn((w) => ({ ...w, doctorId: res.data[0]._id }));
      }
    });
  };

  useEffect(() => { loadDoctors(); }, []);

  const addDoctor = async (e) => {
    e.preventDefault();
    await api.post('/doctors', docForm);
    setDocForm({ name: '', department: '', roomNumber: '', avgConsultationMinutes: 10 });
    loadDoctors();
    setMsg('New OPD Doctor added successfully!');
  };

  const addWalkIn = async (e) => {
    e.preventDefault();
    const res = await api.post('/appointments', { ...walkIn, date: today });
    setWalkIn({ ...walkIn, patientName: '', patientPhone: '', isEmergency: false });
    setMsg(`Walk-in token #${res.data.tokenNumber} issued successfully!`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Reception & Hospital Admin Desk</h1>
        <p className="text-sm text-slate-500">Manage OPD doctor rosters and issue priority walk-in tokens.</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> {msg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={addDoctor} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope size={20} className="text-teal-600" /> Register OPD Doctor
          </h2>
          <input required placeholder="Doctor Name (e.g. Dr. Ananya Sharma)" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          <input required placeholder="Department (e.g. Orthopedics)" value={docForm.department} onChange={(e) => setDocForm({ ...docForm, department: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Room No. (e.g. 204)" value={docForm.roomNumber} onChange={(e) => setDocForm({ ...docForm, roomNumber: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            <input type="number" required placeholder="Avg Mins" value={docForm.avgConsultationMinutes} onChange={(e) => setDocForm({ ...docForm, avgConsultationMinutes: Number(e.target.value) })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition cursor-pointer">
            Add Doctor to Roster
          </button>
        </form>

        <form onSubmit={addWalkIn} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserPlus size={20} className="text-teal-600" /> Walk-In & Emergency Triage
          </h2>
          <select value={walkIn.doctorId} onChange={(e) => setWalkIn({ ...walkIn, doctorId: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white outline-none">
            {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} — {d.department} (Rm {d.roomNumber})</option>)}
          </select>
          <input required placeholder="Patient Full Name" value={walkIn.patientName} onChange={(e) => setWalkIn({ ...walkIn, patientName: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          <input required placeholder="Mobile Number" value={walkIn.patientPhone} onChange={(e) => setWalkIn({ ...walkIn, patientPhone: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500" />

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm cursor-pointer">
            <input type="checkbox" checked={walkIn.isEmergency} onChange={(e) => setWalkIn({ ...walkIn, isEmergency: e.target.checked })} className="w-4 h-4 accent-red-600" />
            <Siren size={18} /> Emergency Triage (Jump to Front of Queue)
          </label>

          <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm transition cursor-pointer">
            Issue Walk-In Token
          </button>
        </form>
      </div>
    </div>
  );
}
