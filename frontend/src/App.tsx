import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import EditorPage from "./pages/EditorPage";
import ExamPage from "./pages/ExamPage";

// Teacher pages
import TeacherOverview from "./pages/teacher/OverviewPage";
import TeacherClasses from "./pages/teacher/ClassesPage";
import TeacherClassDetail from "./pages/teacher/ClassDetailPage";
import TeacherExams from "./pages/teacher/ExamsPage";
import TeacherExamBuilder from "./pages/teacher/ExamBuilderPage";
import TeacherProblemEditor from "./pages/teacher/ProblemEditorPage";
import TeacherExamResults from "./pages/teacher/ExamResultsPage";

// Student pages
import StudentDashboard from "./pages/student/DashboardPage";
import StudentClasses from "./pages/student/ClassesPage";
import StudentExams from "./pages/student/ExamsPage";
import StudentSubmissions from "./pages/student/SubmissionsPage";
import StudentSubmissionDetail from "./pages/student/SubmissionDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Teacher routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherOverview />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="classes/:id" element={<TeacherClassDetail />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="exams/:id" element={<TeacherExamBuilder />} />
          <Route path="problems/:id" element={<TeacherProblemEditor />} />
          <Route path="exams/:id/results" element={<TeacherExamResults />} />
          <Route path="submissions" element={<TeacherExams />} />
          <Route path="settings" element={<TeacherOverview />} />
        </Route>

        {/* Student routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="submissions" element={<StudentSubmissions />} />
          <Route path="submissions/:id" element={<StudentSubmissionDetail />} />
        </Route>

        {/* Standalone pages */}
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id"
          element={
            <ProtectedRoute>
              <ExamPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
