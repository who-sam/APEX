import { Navigate } from "react-router-dom";
import AuthPage from "@/features/auth/pages/AuthPage";

const Index = () => {
  const hasRole = localStorage.getItem("apex-role");
  if (hasRole) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

export default Index;
