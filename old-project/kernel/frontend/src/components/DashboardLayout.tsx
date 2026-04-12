import { AppSidebar } from "@/components/AppSidebar";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Outlet, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Themed geometric pattern background */}
      <div className="fixed inset-0 bg-pattern opacity-[0.07]" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      {/* Floating top navbar */}
      <FloatingNavbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Sidebar - desktop */}
      {!isMobile && <AppSidebar />}

      {/* Sidebar - mobile slide-out */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-4 bg-background border-border">
            <AppSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Page content — offset for sidebar + navbar */}
      <main className={`relative z-10 pt-20 pr-6 pb-6 ${isMobile ? "ml-4" : "ml-20"}`}>
        <Outlet />
      </main>
    </div>
  );
}
