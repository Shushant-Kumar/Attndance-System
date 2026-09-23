import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentManagement from "./pages/StudentManagement";
import RegisterFace from "./pages/RegisterFace";
import LiveCamera from "./pages/LiveCamera";
import AttendanceHistory from "./pages/AttendanceHistory";
import Settings from "./pages/Settings";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout title="Dashboard" />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route element={<Layout title="Student Management" />}>
                <Route path="/students" element={<StudentManagement />} />
              </Route>
              <Route element={<Layout title="Register Face" />}>
                <Route path="/register-face" element={<RegisterFace />} />
              </Route>
              <Route element={<Layout title="Live Camera" />}>
                <Route path="/live-camera" element={<LiveCamera />} />
              </Route>
              <Route element={<Layout title="Attendance History" />}>
                <Route path="/attendance-history" element={<AttendanceHistory />} />
              </Route>
              <Route element={<Layout title="Reports" />}>
                <Route
                  path="/reports"
                  element={<PlaceholderPage title="Reports" phase="P7" />}
                />
              </Route>
              <Route element={<Layout title="Settings" />}>
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
