import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import ApexLogo from "@/components/ApexLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ApexLogo className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight text-foreground">APEX</span>
        </div>
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground">
          The page <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code> doesn't exist.
        </p>
        <Link to="/" className="inline-block mt-4 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
