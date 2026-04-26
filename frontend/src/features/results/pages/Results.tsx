import { useRole } from "@/contexts/AuthContext";
import StudentResults from "./Results.student";
import TeacherResults from "./TeacherResults";

export default function ResultsPage() {
  const { role } = useRole();
  return role === "teacher" ? <TeacherResults /> : <StudentResults />;
}
