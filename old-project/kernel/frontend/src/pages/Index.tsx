import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "./AuthPage";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

export default Index;
