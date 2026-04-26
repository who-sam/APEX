import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Sun, Moon, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import authBg from "@/assets/auth-bg.jpg";
import authBgLight from "@/assets/auth-bg-light.jpg";
import authHero from "@/assets/auth-hero.jpg";
import authHeroLight from "@/assets/auth-hero-light.jpg";
import ApexLogo from "@/components/ApexLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword, resetPassword } from "@/lib/api";

type AuthMode = "login" | "signup" | "forgot" | "reset" | "google-role";

declare global {
  interface Window {
    google?: any;
  }
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["student", "teacher"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;
type ForgotData = z.infer<typeof forgotSchema>;
type ResetData = z.infer<typeof resetSchema>;

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [mode, setMode] = useState<AuthMode>(resetToken ? "reset" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [pendingGoogleEmail, setPendingGoogleEmail] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (resetToken) setMode("reset");
  }, [resetToken]);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "student", middleName: "" },
  });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });
  const resetForm = useForm<ResetData>({ resolver: zodResolver(resetSchema) });

  const onForgot = async (data: ForgotData) => {
    try {
      await forgotPassword(data.email);
      setForgotSent(true);
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Try again", variant: "destructive" });
    }
  };

  const handleGoogleCredential = async (idToken: string, role?: string) => {
    try {
      const res = await loginWithGoogle(idToken, role);
      if (res.needsRole) {
        setPendingGoogleToken(idToken);
        if (res.email) setPendingGoogleEmail(res.email);
        setMode("google-role");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err?.message || "Try again", variant: "destructive" });
    }
  };

  const finishGoogleSignup = async (role: "student" | "teacher") => {
    if (!pendingGoogleToken) return;
    try {
      const res = await loginWithGoogle(pendingGoogleToken, role);
      if (!res.needsRole) {
        toast({ title: "Welcome to APEX!" });
        setPendingGoogleToken(null);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Sign-up failed", description: err?.message || "Try again", variant: "destructive" });
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: { credential: string }) => handleGoogleCredential(resp.credential),
        locale: "en",
      });
      const containers = document.querySelectorAll<HTMLElement>("[data-google-btn]");
      containers.forEach((el) => {
        el.innerHTML = "";
        window.google.accounts.id.renderButton(el, {
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          locale: "en",
          width: 360,
        });
      });
    };
    if (window.google?.accounts?.id) {
      init();
    } else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); init(); }
      }, 200);
      return () => clearInterval(t);
    }
  }, [mode, theme]);

  const onReset = async (data: ResetData) => {
    if (!resetToken) return;
    try {
      await resetPassword(resetToken, data.password);
      toast({ title: "Password updated", description: "You can now log in with your new password." });
      navigate("/auth", { replace: true });
      setMode("login");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err?.message || "Token may be expired or invalid", variant: "destructive" });
    }
  };

  const onLogin = async (data: LoginData) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const onSignup = async (data: SignupData) => {
    try {
      const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
      await signup(data.email, data.password, fullName, data.role);
      toast({ title: "Account created!", description: "Welcome to APEX." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err?.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  const selectedRole = signupForm.watch("role");

  const isDark = theme === "dark";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 overflow-hidden">
      <img src={isDark ? authBg : authBgLight} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 ${isDark ? "bg-black/65" : "bg-white/40"}`} />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative z-10 w-full max-w-5xl">
        <div className={`grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-white/10" : "border-border"}`}>
          {/* Left: Form */}
          <div className="bg-card/95 backdrop-blur-xl p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-8">
              <ApexLogo className="h-7 w-7" />
              <span className="text-xl font-bold tracking-tight text-foreground">APEX</span>
            </div>

            {/* Login Form */}
            {mode === "login" && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                  <p className="text-sm text-muted-foreground mt-1">Log in to your account</p>
                </div>

                <div className="relative h-11">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2 absolute inset-0"
                    disabled={!import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  >
                    <GoogleIcon /> Continue with Google
                  </Button>
                  <div data-google-btn className="absolute inset-0 opacity-0 [&>div]:!w-full [&>div>div]:!w-full" />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or continue with email</span></div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Input type="email" placeholder="Email Address" className="h-11" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Password" className="h-11 pr-10" {...loginForm.register("password")} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {loginForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={() => { setMode("forgot"); setForgotSent(false); }} className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Log In
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">Sign up</button>
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {mode === "forgot" && (
              <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {forgotSent
                      ? "If an account exists for that email, a reset link has been sent."
                      : "Enter your email and we'll send you a reset link."}
                  </p>
                </div>
                {!forgotSent && (
                  <>
                    <div>
                      <Input type="email" placeholder="Email Address" className="h-11" {...forgotForm.register("email")} />
                      {forgotForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>}
                    </div>
                    <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={forgotForm.formState.isSubmitting}>
                      {forgotForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Send Reset Link
                    </Button>
                  </>
                )}
                <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </form>
            )}

            {/* Reset Password Form */}
            {mode === "reset" && (
              <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                  <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account.</p>
                </div>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="New Password" className="h-11 pr-10" {...resetForm.register("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {resetForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <Input type="password" placeholder="Confirm Password" className="h-11" {...resetForm.register("confirmPassword")} />
                  {resetForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
                <button type="button" onClick={() => { navigate("/auth", { replace: true }); setMode("login"); }} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </form>
            )}

            {/* Google Role Picker */}
            {mode === "google-role" && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Almost there</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingGoogleEmail ? `Signing up as ${pendingGoogleEmail}. ` : ""}Choose your role to finish creating your account.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => finishGoogleSignup("student")} className="rounded-lg border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary p-4 text-left transition">
                    <div className="font-semibold text-foreground">Student</div>
                    <div className="text-xs text-muted-foreground mt-1">Take exams, view grades, join classes.</div>
                  </button>
                  <button type="button" onClick={() => finishGoogleSignup("teacher")} className="rounded-lg border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary p-4 text-left transition">
                    <div className="font-semibold text-foreground">Teacher</div>
                    <div className="text-xs text-muted-foreground mt-1">Create exams, manage classes, grade students.</div>
                  </button>
                </div>
                <button type="button" onClick={() => { setPendingGoogleToken(null); setPendingGoogleEmail(""); setMode("login"); }} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            )}

            {/* Signup Form */}
            {mode === "signup" && (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                  <p className="text-sm text-muted-foreground mt-1">Get started with APEX</p>
                </div>

                <div className="relative h-11">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2 absolute inset-0"
                    disabled={!import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  >
                    <GoogleIcon /> Continue with Google
                  </Button>
                  <div data-google-btn className="absolute inset-0 opacity-0 [&>div]:!w-full [&>div>div]:!w-full" />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or continue with email</span></div>
                </div>

                {/* Role selector */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => signupForm.setValue("role", "student")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${selectedRole === "student" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => signupForm.setValue("role", "teacher")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${selectedRole === "teacher" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    Teacher
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input placeholder="First Name" className="h-11" {...signupForm.register("firstName")} />
                    {signupForm.formState.errors.firstName && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Input placeholder="Middle" className="h-11" {...signupForm.register("middleName")} />
                  </div>
                  <div>
                    <Input placeholder="Last Name" className="h-11" {...signupForm.register("lastName")} />
                    {signupForm.formState.errors.lastName && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <Input type="email" placeholder="Email Address" className="h-11" {...signupForm.register("email")} />
                  {signupForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                </div>

                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" className="h-11 pr-10" {...signupForm.register("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {signupForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                </div>

                <div>
                  <Input type="password" placeholder="Confirm Password" className="h-11" {...signupForm.register("confirmPassword")} />
                  {signupForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")} className="font-medium text-primary hover:underline">Log in</button>
                </p>
              </form>
            )}

          </div>

          {/* Right: Hero Image */}
          <div className="hidden md:block">
            <img src={isDark ? authHero : authHeroLight} alt="APEX platform" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
