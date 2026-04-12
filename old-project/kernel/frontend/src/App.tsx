import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardIndex from "./pages/DashboardIndex";
import CodeEditor from "./pages/CodeEditor";
import UpcomingExams from "./pages/UpcomingExams";
import Results from "./pages/Results";
import Practice from "./pages/Practice";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Team from "./pages/Team";
import Help from "./pages/Help";
import ExamBuilder from "./pages/ExamBuilder";
import ExamTaking from "./pages/ExamTaking";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import ExamReview from "./pages/ExamReview";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardIndex />} />
                <Route path="editor" element={<CodeEditor />} />
                <Route path="upcoming" element={<UpcomingExams />} />
                <Route path="results" element={<Results />} />
                <Route path="start" element={<Practice />} />
                <Route path="settings" element={<Settings />} />
                <Route path="messages" element={<Messages />} />
                <Route path="team" element={<Team />} />
                <Route path="help" element={<Help />} />
                <Route path="exam-builder" element={<ExamBuilder />} />
                <Route path="exam/:id" element={<ExamTaking />} />
                <Route path="profile" element={<Profile />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="exam/:id/review" element={<ExamReview />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
