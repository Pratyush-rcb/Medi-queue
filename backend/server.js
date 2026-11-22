require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Otp = require('./models/Otp');
const sendOtpEmail = require('./utils/sendOtpEmail');
const { auth, authorizeRoles } = require('./middlewares/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'mediqueue_super_secret_key_2026';
const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/hospital_queue';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect(MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('DB Error:', err));

async function broadcastQueueUpdate(doctorId, date) {
  const queue = await Appointment.find({ doctorId, date })
    .sort({ isEmergency: -1, tokenNumber: 1 });
  io.emit(`queue_update_${doctorId}`, queue);
  io.emit('lobby_update', queue);
}

const buildFallbackPrescription = (symptomsText) => {
  const clean = symptomsText.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('sleep') || lower.includes('insomnia')) {
    return {
      diagnosis: `Sleep pattern disturbance / mild insomnia (${clean})`,
      medicines: [
        {
          name: 'Melatonin 3 mg',
          dosage: '1 Tablet',
          frequency: '30 minutes before bedtime',
          duration: '7 days',
        },
      ],
      advice:
        'Maintain a consistent sleep and wake time, avoid screens 60 minutes before bed, limit caffeine after noon, and keep the bedroom dark, quiet, and cool.',
    };
  }

  return {
    diagnosis: `Outpatient clinical assessment (${clean})`,
    medicines: [
      {
        name: 'Paracetamol 650 mg',
        dosage: '1 Tablet',
        frequency: 'Twice daily after meals if needed',
        duration: '3 days',
      },
      {
        name: 'Pantoprazole 40 mg',
        dosage: '1 Capsule',
        frequency: 'Once daily before breakfast',
        duration: '5 days',
      },
    ],
    advice:
      'Stay well-hydrated, get adequate rest, follow the prescribed dosage schedule, and return to the OPD if symptoms worsen or persist.',
  };
};

// ================= AUTH & OTP ROUTES =================
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp: otpCode });

    await sendOtpEmail(normalizedEmail, otpCode);
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP email.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password, otp, role, department, roomNumber, avgConsultationMinutes } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    let doctorProfileId = null;

    if (role === 'DOCTOR') {
      const doc = await Doctor.create({
        name,
        department: department || 'General Medicine',
        roomNumber: roomNumber || '101',
        avgConsultationMinutes: avgConsultationMinutes || 10
      });
      doctorProfileId = doc._id;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: role || 'PATIENT',
      doctorProfile: doctorProfileId
    });

    await Otp.deleteMany({ email: normalizedEmail });

    const token = jwt.sign(
      { id: user._id, role: user.role, doctorProfile: user.doctorProfile },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, doctorProfile: user.doctorProfile }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, role: user.role, doctorProfile: user.doctorProfile },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, doctorProfile: user.doctorProfile }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/demo-login', async (req, res) => {
  try {
    const { role } = req.body; // 'PATIENT' | 'DOCTOR' | 'ADMIN'
    const validRoles = ['PATIENT', 'DOCTOR', 'ADMIN'];
    const targetRole = validRoles.includes(role) ? role : 'PATIENT';

    let demoDoctor = await Doctor.findOne({ name: 'Dr. Aarav Sharma' });
    if (!demoDoctor) {
      demoDoctor = await Doctor.create({
        name: 'Dr. Aarav Sharma',
        department: 'General Medicine',
        roomNumber: '104',
        avgConsultationMinutes: 8,
      });
    }

    const demoConfigs = {
      PATIENT: {
        name: 'Rohan Verma (Demo Patient)',
        email: 'demo.patient@mediqueue.app',
        phone: '9876500001',
        role: 'PATIENT',
        doctorProfile: null,
      },
      DOCTOR: {
        name: 'Dr. Aarav Sharma',
        email: 'demo.doctor@mediqueue.app',
        phone: '9876500002',
        role: 'DOCTOR',
        doctorProfile: demoDoctor._id,
      },
      ADMIN: {
        name: 'Hospital Admin (Demo)',
        email: 'demo.admin@mediqueue.app',
        phone: '9876500003',
        role: 'ADMIN',
        doctorProfile: null,
      },
    };

    const cfg = demoConfigs[targetRole];
    let user = await User.findOne({ email: cfg.email });
    if (!user) {
      const hashedPassword = await bcrypt.hash('Demo@1234', 10);
      user = await User.create({ ...cfg, password: hashedPassword });
    }

    const today = new Date().toISOString().split('T')[0];
    const existingCount = await Appointment.countDocuments({ doctorId: demoDoctor._id, date: today });
    if (existingCount === 0) {
      await Appointment.create([
        {
          patientName: 'Ananya Singh',
          patientPhone: '9876500011',
          doctorId: demoDoctor._id,
          date: today,
          tokenNumber: 1,
          status: 'WAITING',
        },
        {
          patientName: 'Rohan Verma (Demo Patient)',
          patientPhone: '9876500001',
          doctorId: demoDoctor._id,
          date: today,
          tokenNumber: 2,
          status: 'WAITING',
        },
      ]);
      await broadcastQueueUpdate(demoDoctor._id, today);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, doctorProfile: user.doctorProfile },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorProfile: user.doctorProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Demo login failed', error: err.message });
  }
});

app.get('/api/appointments/my', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const appointments = await Appointment.find({ patientPhone: user.phone })
    .populate('doctorId')
    .sort({ createdAt: -1 });
  res.json(appointments);
});

// ================= DOCTOR & QUEUE ROUTES =================
app.get('/api/doctors', async (req, res) => {
  const doctors = await Doctor.find();
  res.json(doctors);
});

app.post('/api/doctors', auth, authorizeRoles('ADMIN'), async (req, res) => {
  const doctor = await Doctor.create(req.body);
  res.json(doctor);
});

app.post('/api/appointments', auth, async (req, res) => {
  try {
    const { patientName, patientPhone, doctorId, date, isEmergency } = req.body;

    if (req.user.role !== 'ADMIN') {
      const existingActive = await Appointment.findOne({
        patientPhone: patientPhone.trim(),
        doctorId,
        date,
        status: { $in: ['WAITING', 'IN_CONSULTATION'] }
      });

      if (existingActive) {
        return res.status(400).json({
          message: `You already have an active token (#${existingActive.tokenNumber}) with this doctor today.`,
          existingToken: existingActive
        });
      }
    }

    const count = await Appointment.countDocuments({ doctorId, date });
    const tokenNumber = count + 1;

    const appointment = await Appointment.create({
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      doctorId,
      date,
      tokenNumber,
      isEmergency: req.user.role === 'ADMIN' ? (isEmergency || false) : false
    });

    await broadcastQueueUpdate(doctorId, date);
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/appointments/:id/status', auth, authorizeRoles('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid appointment status' });
    }

    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (existing.status === 'COMPLETED' || existing.status === 'NO_SHOW') {
      return res.status(400).json({ message: 'Completed or skipped tokens cannot be modified' });
    }

    if (status === 'IN_CONSULTATION') {
      if (existing.status !== 'WAITING') {
        return res.status(400).json({ message: 'Only waiting tokens can be called in' });
      }
      const alreadyActive = await Appointment.findOne({
        doctorId: existing.doctorId,
        date: existing.date,
        status: 'IN_CONSULTATION',
      });
      if (alreadyActive) {
        return res.status(400).json({ message: 'Another patient is already in consultation' });
      }
    }

    existing.status = status;
    await existing.save();

    await broadcastQueueUpdate(existing.doctorId, existing.date);
    res.json(existing);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// ================= AI PRESCRIPTION & REPORT ROUTES =================
app.post('/api/appointments/:id/ai-prescription', auth, authorizeRoles('DOCTOR', 'ADMIN'), async (req, res) => {
  const { symptoms, patientAge } = req.body;
  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ message: 'Please enter symptoms or clinical notes first.' });
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a clinical documentation assistant helping a licensed doctor format an outpatient prescription draft.
Patient Notes: "${symptoms.trim()}" ${patientAge ? `(Age: ${patientAge})` : ''}.
Return ONLY valid JSON with this exact structure (no markdown backticks):
{
  "diagnosis": "Concise provisional diagnosis",
  "medicines": [
    { "name": "Medicine name & strength", "dosage": "1 tab / 5 ml", "frequency": "Twice daily after meals", "duration": "5 days" }
  ],
  "advice": "Practical lifestyle, care, and follow-up instructions"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanedJson = rawText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          if (parsed && (parsed.diagnosis || parsed.medicines || parsed.advice)) {
            return res.json({
              diagnosis: parsed.diagnosis || `Clinical assessment (${symptoms.trim()})`,
              medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
              advice: parsed.advice || '',
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('AI prescription fallback triggered:', err.message);
  }

  return res.json(buildFallbackPrescription(symptoms));
});

app.post('/api/appointments/:id/prescription', auth, authorizeRoles('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { symptoms, diagnosis, medicines, advice } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'COMPLETED',
        prescription: {
          symptoms,
          diagnosis,
          medicines,
          advice,
          issuedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await broadcastQueueUpdate(appointment.doctorId, appointment.date);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save prescription', error: err.message });
  }
});

// ================= QR TOKEN VERIFICATION =================
app.get('/api/appointments/:id/verify', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('doctorId');
    if (!appointment) {
      return res.status(404).json({ message: 'Token not found' });
    }

    const aheadCount = await Appointment.countDocuments({
      doctorId: appointment.doctorId._id,
      date: appointment.date,
      status: 'WAITING',
      tokenNumber: { $lt: appointment.tokenNumber },
    });

    res.json({ appointment, aheadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify token', error: err.message });
  }
});

app.get('/api/queue/:doctorId/:date', async (req, res) => {
  const { doctorId, date } = req.params;
  const queue = await Appointment.find({ doctorId, date })
    .sort({ isEmergency: -1, tokenNumber: 1 });
  res.json(queue);
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));