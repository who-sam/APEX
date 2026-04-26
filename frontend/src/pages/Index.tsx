import { Navigate } from "react-router-dom";
import AuthPage from "@/features/auth/pages/AuthPage";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

export default Index;
