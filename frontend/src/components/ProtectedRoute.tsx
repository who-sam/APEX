import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "teacher" | "student";
}) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "teacher" ? "/teacher" : "/dashboard"} replace />;
  }
  return <>{children}</>;
}
