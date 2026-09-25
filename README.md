# 🎓 AI-Based Smart Attendance System

An enterprise-grade, real-time facial recognition attendance system designed for schools, universities, and organizations. Built with **FastAPI**, **React 18**, **PostgreSQL (Docker)**, **OpenCV**, **YOLO**, and **dlib embeddings**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Database (Docker Compose)](#1-database-docker-compose)
  - [2. Backend Setup & Seeding](#2-backend-setup--seeding)
  - [3. Frontend Setup](#3-frontend-setup)
- [Default Credentials](#-default-credentials)
- [Workflow & How It Works](#-workflow--how-it-works)
- [Face Recognition Engine](#-face-recognition-engine)
- [Group Photo Attendance Concept (Design Proposal)](#-group-photo-attendance-concept-design-proposal)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [License](#-license)

---

## 🌟 Overview

Traditional attendance management is slow, prone to proxy attendance, and tedious for teachers. This system leverages deep learning face embeddings to detect and identify students in real-time through an interactive webcam interface, automatically recording attendance to a PostgreSQL database with duplicate prevention.

---

## 🎯 Key Features

- **⚡ Real-Time Face Recognition**: Multi-face detection and identification via webcam feed using 128-dimensional deep metric embeddings.
- **🛡️ Duplicate Attendance Prevention**: Database-level and application-level unique constraints (`UNIQUE(student_id, date)`) ensure students cannot be marked multiple times on the same calendar day.
- **📸 Smart Face Registration**: Captures 20–30 varied angle frames per student, generates vector embeddings, and computes a noise-reduced average profile embedding.
- **🪞 Mirrored Camera with Correct Overlay**: True-to-life selfie-style camera view while rendering names, confidence percentages, and status tags in natural, readable orientation.
- **📊 Interactive Dashboard**: Real-time stats (Total Students, Present Today, Absent Today, Attendance Rate), 7-day trend visualizations, and live activity feeds.
- **📋 Student Directory & Management**: Full CRUD operations for student records with department, year, and section segmentation.
- **🔍 Filterable Attendance Records**: Filter attendance records by date range, department, year, section, or student name/roll number.
- **📑 Exportable Reports**: One-click download of filtered attendance records in **PDF** or **Excel (.xlsx)** format.
- **⏱️ Manual Override**: Instructors can manually record or adjust attendance if a student cannot be recognized due to camera issues or medical reasons.
- **🔒 Security & Auth**: Password hashing using bcrypt, stateless JWT bearer token authentication, SQL-injection-safe SQLAlchemy ORM, and action audit logging.

---

## 📦 Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python async REST API |
| **Database** | [PostgreSQL 16](https://www.postgresql.org/) | Relational database deployed via Docker or Supabase |
| **ORM** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | Object relational mapping & query building |
| **Vision & AI** | YOLO + dlib embeddings + OpenCV | YOLO face detection & ResNet-based 128-d identity embeddings |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | High-speed single-page application |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first responsive design with dark mode support |
| **Charts** | [Recharts](https://recharts.org/) | Dynamic attendance analytics & 7-day trend charts |
| **Document Export** | ReportLab & OpenPyXL | Server-side PDF generation & Excel workbook exports |
| **Containerization** | Docker & Docker Compose | Containerized PostgreSQL service |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React 18 Frontend                     │
│    (Dashboard, Live Camera, Student Management, Reports)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (Axios)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│  ├── /api/auth               (JWT Authentication)           │
│  ├── /api/students           (Student CRUD)                 │
│  ├── /api/face-registration  (Webcam Multi-Angle Capture)   │
│  ├── /api/recognition        (Embedding Matching Engine)    │
│  ├── /api/attendance         (Daily Attendance Logic)       │
│  └── /api/reports            (PDF & Excel Exporters)        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   PostgreSQL 16 (Docker)     │ │   Dataset Storage (/dataset)│
│  • admins                    │ │  • Student face crops      │
│  • students (with embedding) │ │  • Multi-angle samples     │
│  • attendance records        │ └────────────────────────────┘
│  • audit logs & settings     │
└──────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (tested on Python 3.11 & 3.13)
- **Node.js 18+** & npm
- **Docker Desktop** (for PostgreSQL container)
- **Webcam** (built-in or USB camera for facial recognition)

---

### 1. Database (Docker Compose)

Start the containerized PostgreSQL service:

```bash
docker compose up -d
```

Verify that the database container is running:
```bash
docker ps
```
The container `attendance_postgres` will be running on port `5432`.

---

### 2. Backend Setup & Seeding

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. *(Optional)* Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   # ── PostgreSQL Connection ────────────────────────────────────
   DATABASE_URL=postgresql://postgres:password123@localhost:5432/attendance_system

   # ── JWT Authentication ───────────────────────────────────────
   JWT_SECRET_KEY=attendancesystem_jwt_secret_key_2026_super_secure!
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_MINUTES=120

   # ── Face Recognition Parameters ──────────────────────────────
   FACE_MATCH_TOLERANCE=0.45
   FACE_DATASET_DIR=../dataset
   # Face-specific YOLO checkpoint; downloaded by Ultralytics on first use
   YOLO_FACE_MODEL=https://github.com/akanametov/yolo-face/releases/download/1.0.0/yolov11n-face.pt
   YOLO_FACE_CONFIDENCE=0.35
   YOLO_FACE_IMAGE_SIZE=640

   # ── CORS Settings ────────────────────────────────────────────
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. Initialize the database schema and seed the initial administrator:
   ```bash
   python -m app.seed
   ```

6. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   * Swagger Documentation is live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   * ReDoc Documentation is live at: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   # Windows PowerShell:
   npm.cmd run dev
   # Or standard bash:
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Deploy the Backend to Railway

The repository includes `railway.toml` for deploying the FastAPI backend from
the repository root. Create a Railway service from this repository and add the
following variables in the service settings:

```env
ENV=production
DATABASE_URL=<your PostgreSQL connection string>
JWT_SECRET_KEY=<random value with at least 32 characters>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=120
CORS_ORIGINS=https://<your-vercel-domain>
ADMIN_EMAIL=<administrator email>
ADMIN_PASSWORD=<administrator password with at least 12 characters>
ADMIN_FULL_NAME=System Administrator
```

Set `VITE_API_URL` in Vercel to the Railway public URL, without the `/api`
suffix, then redeploy the frontend. The frontend adds `/api` itself.

For persistent face-capture images, attach a Railway volume mounted at
`/data`. The production default stores captures under `/data/dataset`.

After the first deployment, initialize the database and create the admin from
the Railway service shell:

```bash
cd backend && python -m app.seed
```

Use `/api/health` as the service health check. Railway supplies `$PORT`, which
is consumed by the start command in `railway.toml`.

---

## 🔑 Administrator Account

There are no production default credentials. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
and `ADMIN_FULL_NAME` in the backend environment, then run `python -m app.seed`.
The admin email is only used as a login identifier; the application does not send email.

---

## 📋 Workflow & How It Works

1. **Administrator Login**: Secure login with JWT session token.
2. **Add Students**: Navigate to **Student Management** → Click **Add Student** (Roll Number, Full Name, Department, Year, Section, optional Email/Phone).
3. **Enroll Face Data**: Click the **Scan Face** icon next to any student:
   - Starts camera feed and captures 20–30 frames at varied head angles (straight, slight left, slight right, slight tilt).
   - Generates 128-d face embeddings and averages them to create a resilient baseline face profile.
4. **Live Attendance Marking**: Navigate to **Live Camera** → Click **Start Attendance Marking**:
   - Detects all faces in frame in real-time.
   - Computes distance against known student embeddings.
   - Once recognized, automatically marks `Present` in the database.
   - Prevents duplicates (subsequent frames within the same day are marked as `Already Marked`).
5. **View Dashboard & Reports**:
   - Check attendance rates and live charts on the Dashboard.
   - Search historical records by date or department on the Attendance History page.
   - Export official attendance sheets to **PDF** or **Excel**.

---

## 🧠 Face Recognition Engine

- **Face Detection**: a face-specific YOLO checkpoint (`yolov11n-face.pt`) finds faces and supplies the bounding boxes for registration and live attendance. Ultralytics downloads the checkpoint on first use unless `YOLO_FACE_MODEL` points to a local file or another supported checkpoint.
- **Identity Model**: dlib's ResNet-based face metric model generates the existing 128-dimensional embeddings. YOLO detects the face; the embedding matcher identifies which registered student it belongs to.
- **Metric Distance**: Euclidean distance between 128-dimensional embedding vectors.
  - **Distance < 0.40**: Extremely confident match (same person).
  - **Distance 0.40 – 0.45**: Positive match threshold (`FACE_MATCH_TOLERANCE`).
  - **Distance > 0.45**: Unrecognized person (`Unknown`).
- **Live Camera Visual Indicators**:
  - 🟩 **Green Box**: Student recognized and freshly marked present.
  - 🟦 **Blue Box**: Student recognized, already marked present earlier today.
  - 🟥 **Red Box**: Unrecognized or unregistered face.

---

## 📸 Group Photo Attendance Concept (Design Proposal)

For batch marking an entire classroom at once using a single wide-angle photo, the following architecture is recommended:

```
[Upload Classroom Photo]
          │
          ▼
[High-Resolution Multi-Face Detection (RetinaFace / Upsampled HOG)]
          │
          ├──► Match against student embeddings ──► Automatically mark "Present"
          │
          └──► Unregistered or low-confidence faces
                     │
                     ▼
[Interactive Photo Tagging Canvas]
  • Green badge: Recognized students (e.g., "Rahul Sharma")
  • Amber badge: Unregistered faces ("Click to assign student")
  • Instructor clicks an unassigned face ──► Selects student from dropdown
  • Instantly binds face embedding to the student and records attendance
```

### Technical Considerations for Group Photos
1. **Face Scale & Distance**: In photos with 30–60 students, faces in rear rows are small. Standard HOG detection should be upsampled (`face_locations(..., number_of_times_to_upsample=2)`), or upgraded to **RetinaFace / YOLOv8-Face** for higher small-face recall.
2. **Provisional Registration**: Faces registered from a single group photo crop should be flagged with `provisional` quality until a full multi-angle capture is performed via webcam.

---

## 🔌 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate admin credentials and return JWT bearer token |
| `GET` | `/api/auth/me` | Fetch current administrator profile |

### Students (`/api/students`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | List paginated students with search, dept, year, section filters |
| `POST` | `/api/students` | Create new student record |
| `GET` | `/api/students/{id}` | Get student profile |
| `PUT` | `/api/students/{id}` | Update student details |
| `DELETE` | `/api/students/{id}` | Delete student and cascading face & attendance data |

### Face Registration (`/api/face-registration`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/face-registration/status/{student_id}` | Check capture progress (target vs. captured count) |
| `POST` | `/api/face-registration/capture/{student_id}` | Capture single frame, detect face, save sample crop |
| `POST` | `/api/face-registration/finalize/{student_id}` | Compute average 128-d embedding and finalize profile |
| `DELETE` | `/api/face-registration/reset/{student_id}` | Clear captured samples to restart capture |

### Attendance (`/api/attendance`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/attendance/mark` | Process live frame, identify faces, mark attendance |
| `GET` | `/api/attendance/today` | Fetch all attendance entries for current calendar day |
| `GET` | `/api/attendance/history` | Query attendance history with multiple filter options |
| `POST` | `/api/attendance/manual` | Manually mark or adjust a student's attendance |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/export/pdf` | Download formatted attendance summary as PDF |
| `GET` | `/api/reports/export/excel` | Download attendance records as Excel (.xlsx) spreadsheet |

---

## 📁 Project Directory Structure

```
attendance-system/
├── backend/
│   ├── app/
│   │   ├── api/                  # API route endpoints
│   │   │   ├── auth.py           # Login and token issuance
│   │   │   ├── students.py       # Student record management
│   │   │   ├── face_registration.py # Multi-frame capture & profile finalize
│   │   │   ├── recognition.py    # Status and known count checks
│   │   │   ├── attendance.py     # Live frame marking and history
│   │   │   ├── reports.py        # PDF and Excel generation
│   │   │   └── settings.py       # Admin configuration & password
│   │   ├── core/                 # Auth dependencies, security utilities
│   │   ├── models/               # SQLAlchemy models (Student, Admin, Attendance, etc.)
│   │   ├── schemas/              # Pydantic data schemas & validators
│   │   ├── utils/                # Face detection, embedding math, report generators
│   │   ├── config.py             # Environment configuration loader
│   │   ├── database.py           # SQLAlchemy engine & session factory
│   │   ├── main.py               # FastAPI application entrypoint
│   │   └── seed.py               # Database initialization & default admin seeder
│   ├── database/
│   │   └── schema.sql            # PostgreSQL/Neon reference schema
│   ├── .env.example              # Backend environment template
│   └── requirements.txt          # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios API service clients
│   │   ├── components/           # Navbar, Modals, StudentForm, Cards
│   │   ├── context/              # Auth and Theme React contexts
│   │   ├── hooks/                # useWebcam & camera helper hooks
│   │   ├── pages/                # LiveCamera, Dashboard, StudentManagement, History
│   │   ├── App.jsx               # Application routing
│   │   └── main.jsx              # React DOM entrypoint
│   ├── package.json              # Frontend npm dependencies
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   └── vite.config.js            # Vite bundler & API reverse proxy configuration
├── dataset/                      # Local development storage for captured images
├── docker-compose.yml            # Docker Compose configuration for PostgreSQL
└── README.md                     # Project documentation
```

## ☁️ Production Deployment

### Neon

Create a Neon PostgreSQL database and copy its pooled connection string into
Render's `DATABASE_URL` variable. Keep `sslmode=require` in the connection URL.
The application creates its SQLAlchemy tables when `python -m app.seed` runs.
The matching reference SQL is stored at `backend/database/schema.sql`.

### Render backend

1. Create a new Render Blueprint from this repository. Render will use `render.yaml`.
2. Set `DATABASE_URL`, `CORS_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
   `ADMIN_FULL_NAME` as secret environment variables. `CORS_ORIGINS` must be the
   exact Vercel production URL, such as `https://attendance.example.vercel.app`.
3. After the first deploy, open Render Shell and run `python -m app.seed` once.
4. The service exposes `/api/health`; use it as the deployment health check.

The Render blueprint includes a persistent disk for captured face images. This
is required because Render's default filesystem is ephemeral.

### Vercel frontend

1. Import the repository into Vercel and set the project root to `frontend`.
2. Set `VITE_API_URL` to the public Render backend URL without a trailing slash,
   for example `https://attendance-api.onrender.com`.
3. Use `npm run build` as the build command and `dist` as the output directory.

For local development, copy `backend/.env.example` to `backend/.env` and
`frontend/.env.example` to `frontend/.env.local`, then replace the placeholders.
Do not commit either real environment file.

---

## ❓ Troubleshooting & FAQs

### 1. PowerShell Script Execution Blocked on Windows
If running `npm run dev` in Windows PowerShell gives `PSSecurityException`:
```powershell
npm.cmd run dev
```
Alternatively, set your execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 2. Camera Access Denied
Ensure your browser has granted webcam permissions for `http://localhost:5173`. In Chrome:
- Click the tune/camera icon on the left of the address bar → Enable **Camera**.

### 3. Database Connection Refused
If the backend fails to connect to PostgreSQL:
- Ensure Docker Desktop is running.
- Verify container status with `docker ps` to ensure `attendance_postgres` is healthy on port `5432`.
- If port `5432` is occupied by another local Postgres instance, map a different port in `docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` in `backend/.env`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Free for educational and commercial use.
