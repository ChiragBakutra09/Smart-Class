import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinClass from "./pages/JoinClass";
import RoleRedirect from "./pages/RoleRedirect";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubjects from "./pages/StudentSubjects";
import StudentAnnouncements from "./pages/StudentAnnouncements";
import StudentProfile from "./pages/StudentProfile";

import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherClasses from "./pages/TeacherClasses";
import TeacherSubjects from "./pages/TeacherSubjects";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherAnnouncements from "./pages/TeacherAnnouncements";

import Leaderboard from "./pages/Leaderboard";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/redirect" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join/:token" element={<JoinClass />} />
            <Route path="/redirect" element={<RoleRedirect />} />

            <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
              <Route index element={<StudentDashboard />} />
              <Route path="subjects" element={<StudentSubjects />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
              <Route index element={<TeacherDashboard />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="subjects" element={<TeacherSubjects />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="announcements" element={<TeacherAnnouncements />} />
              <Route path="leaderboard" element={<Leaderboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/redirect" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
