import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Layouts
import DashboardLayout from "@/components/DashboardLayout";
import TeacherLayout from "@/components/TeacherLayout";

// Public pages
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";

// Student pages
import Dashboard from "@/pages/Dashboard";
import CodeEditor from "@/pages/CodeEditor";
import UpcomingExams from "@/pages/UpcomingExams";
import Results from "@/pages/Results";
import Practice from "@/pages/Practice";
import Settings from "@/pages/Settings";
import Messages from "@/pages/Messages";
import Team from "@/pages/Team";
import Help from "@/pages/Help";
import ExamTaking from "@/pages/ExamTaking";
import MyClasses from "@/pages/MyClasses";

// Teacher pages
import TeacherOverview from "@/pages/teacher/OverviewPage";
import TeacherClasses from "@/pages/teacher/ClassesPage";
import TeacherClassDetail from "@/pages/teacher/ClassDetailPage";
import TeacherExams from "@/pages/teacher/ExamsPage";
import TeacherExamBuilder from "@/pages/teacher/ExamBuilderPage";
import TeacherProblemEditor from "@/pages/teacher/ProblemEditorPage";
import TeacherExamResults from "@/pages/teacher/ExamResultsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<AuthPage />} />

            {/* Student dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="student">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="editor" element={<CodeEditor />} />
              <Route path="upcoming" element={<UpcomingExams />} />
              <Route path="results" element={<Results />} />
              <Route path="start" element={<Practice />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="classes" element={<MyClasses />} />
              <Route path="team" element={<Team />} />
              <Route path="help" element={<Help />} />
              <Route path="exam/:examId" element={<ExamTaking />} />
            </Route>

            {/* Teacher dashboard */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherOverview />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="classes/:id" element={<TeacherClassDetail />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="exams/:id" element={<TeacherExamBuilder />} />
              <Route path="exams/:id/results" element={<TeacherExamResults />} />
              <Route path="problems/:id" element={<TeacherProblemEditor />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<Messages />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
