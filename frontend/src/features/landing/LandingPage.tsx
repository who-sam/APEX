import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingHeader from "./components/LandingHeader";
import LandingFooter from "./components/LandingFooter";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import Features from "./sections/Features";
import Workflow from "./sections/Workflow";
import Roles from "./sections/Roles";
import Stack from "./sections/Stack";
import FAQ from "./sections/FAQ";
import CTA from "./sections/CTA";

const LandingPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Workflow />
        <Roles />
        <Stack />
        <FAQ />
        <CTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
