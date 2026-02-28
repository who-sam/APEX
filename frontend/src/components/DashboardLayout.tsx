import { AppSidebar } from "@/components/AppSidebar";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Themed geometric pattern background */}
      <div className="fixed inset-0 bg-pattern opacity-[0.07]" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      {/* Floating top navbar */}
      <FloatingNavbar />

      {/* Floating icon sidebar */}
      <AppSidebar />

      {/* Page content — offset for sidebar + navbar */}
      <main className="relative z-10 ml-20 pt-20 pr-6 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
