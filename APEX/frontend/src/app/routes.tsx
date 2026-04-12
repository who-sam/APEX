import { Routes, Route } from "react-router-dom";
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
import GradeWritten from "@/features/grading/pages/GradeWritten";
import Leaderboard from "@/features/results/pages/Leaderboard";
import Practice from "@/features/social/pages/Practice";
import Team from "@/features/social/pages/Team";
import Messages from "@/features/social/pages/Messages";
import HelpPage from "@/features/social/pages/Help";
import Notifications from "@/features/social/pages/Notifications";
import ExamPreview from "@/features/exams/pages/ExamPreview";
import { useRole } from "@/contexts/AuthContext";

function ExamsPage() {
  const { role } = useRole();
  return role === "teacher" ? <TeacherExams /> : <UpcomingExams />;
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
        <Route path="exam-builder" element={<ExamBuilder />} />
        <Route path="question-bank" element={<QuestionBank />} />
        <Route path="grade-written" element={<GradeWritten />} />
        <Route path="exam/:id" element={<ExamTaking />} />
        <Route path="exam/:id/review" element={<ExamReview />} />
        <Route path="exam-preview/:id" element={<ExamPreview />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="practice" element={<Practice />} />
        <Route path="team" element={<Team />} />
        <Route path="messages" element={<Messages />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
