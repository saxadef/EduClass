import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentPortal from './pages/StudentPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminInstructions from './pages/AdminInstructions';
import AdminFileManager from './pages/AdminFileManager';
import AdminSubmissions from './pages/AdminSubmissions';
import AdminSubmissionDetail from './pages/AdminSubmissionDetail';
import AdminStudentData from './pages/AdminStudentData';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Student Submission Portal */}
        <Route path="/" element={<StudentPortal />} />

        {/* Private Administrative Desk */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Course content and section assignments */}
        <Route path="/admin/instructions" element={<AdminInstructions />} />

        {/* Shared file locker and asset manager */}
        <Route path="/admin/files" element={<AdminFileManager />} />
        
        {/* Homework assignments and gradebook management */}
        <Route path="/admin/submissions" element={<AdminSubmissions />} />
        <Route path="/admin/submissions/:id" element={<AdminSubmissionDetail />} />
        
        {/* Authorized student rosters and class directory sections */}
        <Route path="/admin/students" element={<AdminStudentData />} />
        
        {/* Settings, Limits configuration, and Apps Script deploy helper */}
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
