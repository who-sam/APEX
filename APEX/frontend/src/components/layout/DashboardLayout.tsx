import { FloatingNavbar } from "@/components/layout/FloatingNavbar";
import { Outlet, Navigate } from "react-router-dom";

export default function DashboardLayout() {
  const hasRole = localStorage.getItem("kernel-role") || localStorage.getItem("apex-role");
  if (!hasRole || hasRole === "") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="fixed inset-0 bg-pattern opacity-[0.15]" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      <FloatingNavbar />

      <main className="relative z-10 pt-20 px-6 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
