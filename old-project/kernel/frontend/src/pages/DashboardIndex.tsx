import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import TeacherDashboard from "./TeacherDashboard";

export default function DashboardIndex() {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherDashboard /> : <Dashboard />;
}
