# MediQueue — Smart OPD Queue & Token Management System

🔗 **Live Demo:** [https://medi-queue-bice.vercel.app/login](https://medi-queue-bice.vercel.app/login)  
📺 **Live Lobby Display:** [https://medi-queue-bice.vercel.app/lobby](https://medi-queue-bice.vercel.app/lobby)

A full-stack hospital Outpatient Department (OPD) queue and token management platform built with the **MERN stack** and **Socket.io**. MediQueue eliminates waiting-room bottlenecks with real-time WebSocket queue synchronization, live lobby display boards, QR-code digital boarding passes, role-based portals, and AI-assisted outpatient prescriptions.

---

## Key Features

- **Real-Time Live Lobby Board (`/lobby`)**: Full-screen waiting room display synchronized over Socket.io showing active consultations, upcoming tokens, doctor room assignments, and live queue updates.
- **Role-Based Access Control (RBAC)**:
  - **Patient Portal**: Book OPD tokens by doctor/department, track live queue position and estimated wait times, scan QR boarding passes, and view or print digital prescriptions & visit reports (**My Token & Reports**).
  - **Doctor Console (`/doctor`)**: Manage daily OPD queues, call next patients (`IN_CONSULTATION`), mark `NO_SHOW`, generate AI-drafted prescriptions (via Gemini API with clinical fallback), and complete consultations.
  - **Reception & Admin Panel (`/admin`)**: Manage doctors, room numbers, consultation durations, walk-in bookings, and priority/emergency token overrides.
- **QR Code Token Verification (`/verify/:id`)**: Each booked token generates a unique QR code linking to a mobile-friendly digital pass displaying real-time queue status, patients ahead, estimated wait time, and issued clinical prescriptions.
- **One-Click Demo Logins**: Built-in demo accounts on the login page for **Patient**, **Doctor**, and **Admin** roles for instant testing without manual signup.
- **Email OTP Verification**: Secure account registration powered by time-limited OTP verification.

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router DOM, Tailwind CSS, Lucide Icons, `qrcode.react`, Axios, Socket.io Client
- **Backend**: Node.js, Express.js, Socket.io, Mongoose, JSON Web Tokens (JWT), Bcrypt.js
- **Database**: MongoDB / MongoDB Atlas
- **AI & Services**: Google Gemini API (`gemini-2.5-flash`) for clinical prescription drafting, Nodemailer for OTP delivery
- **Deployment**: Vercel (Frontend SPA) & Render (Backend Web Service)

---

## Project Structure

```text
hospital-queue-system/
├── backend/
│   ├── middlewares/       # JWT authentication & role authorization
│   ├── models/            # Mongoose schemas (User, Doctor, Appointment, Otp)
│   ├── utils/             # Email OTP utility
│   ├── server.js          # Express API, Socket.io events & AI prescription routes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/       # AuthContext for session & role state
│   │   ├── pages/         # LobbyScreen, PatientBooking, MyTokens, VerifyToken, DoctorDashboard, AdminPanel, Login, Signup
│   │   ├── api.js         # Axios instance & Socket.io client configuration
│   │   └── App.jsx        # Protected routes & navigation layout
│   ├── vercel.json        # SPA rewrite configuration for client-side routing
│   └── package.json
└── README.md
