import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import authBg from "@/assets/auth-bg.jpg";

export default function DashboardLayout() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Background wallpaper with dark tint */}
      <img
        src={authBg}
        alt=""
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="fixed inset-0 bg-background/85" />

      {/* Floating top navbar */}
      <Navbar />

      {/* Floating icon sidebar */}
      <Sidebar />

      {/* Page content — offset for sidebar + navbar */}
      <main className="relative z-10 ml-20 pt-20 pr-6 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
