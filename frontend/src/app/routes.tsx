import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import AuthPage from "@/features/auth/pages/AuthPage";
import Unauthorized from "@/features/auth/pages/Unauthorized";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardIndex from "@/features/dashboard/pages/DashboardIndex";
import CodeEditor from "@/features/playground/pages/CodeEditor";
import UpcomingExams from "@/features/exams/pages/UpcomingExams";
import TeacherExams from "@/features/exams/pages/TeacherExams";
import Results from "@/features/results/pages/Results";
import Settings from "@/features/settings/pages/Settings";
import ExamBuilder from "@/features/exams/pages/ExamBuilder";
import ExamTaking from "@/features/exams/pages/ExamTaking";
import Profile from "@/features/settings/pages/Profile";
import ExamReview from "@/features/exams/pages/ExamReview";
import Courses from "@/features/courses/pages/Courses";
import CourseDetail from "@/features/courses/pages/CourseDetail";
import QuestionBank from "@/features/exams/pages/QuestionBank";
import QuestionBankEditor from "@/features/exams/pages/QuestionBankEditor";
import GradeWritten from "@/features/grading/pages/GradeWritten";
import HelpPage from "@/features/social/pages/Help";
import Notifications from "@/features/social/pages/Notifications";
import ExamPreview from "@/features/exams/pages/ExamPreview";
import { useRole } from "@/contexts/AuthContext";

function ExamsPage() {
  const { role } = useRole();
  return role === "teacher" ? <TeacherExams /> : <UpcomingExams />;
}

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  if (role !== "teacher") return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  if (role !== "student") return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardIndex />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="playground" element={<CodeEditor />} />
        <Route path="results" element={<Results />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="exam-builder" element={<TeacherRoute><ExamBuilder /></TeacherRoute>} />
        <Route path="question-bank" element={<TeacherRoute><QuestionBank /></TeacherRoute>} />
        <Route path="question-bank/new" element={<TeacherRoute><QuestionBankEditor /></TeacherRoute>} />
        <Route path="question-bank/:id" element={<TeacherRoute><QuestionBankEditor /></TeacherRoute>} />
        <Route path="grading" element={<TeacherRoute><GradeWritten /></TeacherRoute>} />
        <Route path="exam/:id" element={<StudentRoute><ExamTaking /></StudentRoute>} />
        <Route path="exam/:id/review" element={<StudentRoute><ExamReview /></StudentRoute>} />
        <Route path="exam-preview/:id" element={<TeacherRoute><ExamPreview /></TeacherRoute>} />
        <Route path="help" element={<HelpPage />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
