import { FloatingNavbar } from "@/components/layout/FloatingNavbar";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/features/social/contexts/NotificationContext";

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <NotificationProvider>
      <div className="relative min-h-screen w-full bg-background">
        <div className="fixed inset-0 bg-pattern opacity-[0.15]" />
        <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

        <FloatingNavbar />

        <main className="relative z-10 pt-20 px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </NotificationProvider>
  );
}
