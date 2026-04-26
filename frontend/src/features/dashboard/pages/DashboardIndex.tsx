import { useRole } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import TeacherDashboard from "./TeacherDashboard";

export default function DashboardIndex() {
  const { role } = useRole();
  return role === "teacher" ? <TeacherDashboard /> : <Dashboard />;
}
