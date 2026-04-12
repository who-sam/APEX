import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, BookOpen, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";
import KernelLogo from "@/components/KernelLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Role = "teacher" | "student";
type AuthMode = "select" | "signup" | "login" | "forgot";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignupData = z.infer<typeof signupSchema>;
type LoginData = z.infer<typeof loginSchema>;

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("select");
  const [role, setLocalRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const auth = useAuth();
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) });
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const selectRole = (r: Role) => {
    setLocalRole(r);
    setMode("signup");
  };

  const onSignup = async (data: SignupData) => {
    setAuthError("");
    try {
      await auth.signup(data.email, data.password, data.name, role);
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Signup failed");
    }
  };

  const onLogin = async (data: LoginData) => {
    setAuthError("");
    try {
      await auth.login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    }
  };

  const handleSocialLogin = () => {
    toast({ title: "Coming soon", description: "Social login will be available soon." });
  };

  const handleForgotPassword = () => {
    if (!forgotEmail) return;
    toast({ title: "Reset link sent", description: `Check ${forgotEmail} for a password reset link.` });
    setMode("login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
      <img src={authBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <KernelLogo className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight text-white">Kernel</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/15 bg-card/90 backdrop-blur-xl shadow-2xl p-8 transition-all duration-300">
          {/* Role Selection */}
          {mode === "select" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Welcome to Kernel</h1>
                <p className="mt-2 text-sm text-muted-foreground">Choose your role to get started</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectRole("teacher")}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-6 transition-all hover:border-primary/50 hover:bg-primary/10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <span className="text-base font-semibold text-foreground">I'm a Teacher</span>
                  <span className="text-xs text-muted-foreground text-center">Create exams, manage classes, and grade students</span>
                </button>
                <button
                  onClick={() => selectRole("student")}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-6 transition-all hover:border-primary/50 hover:bg-primary/10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent transition-colors group-hover:bg-accent/25">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <span className="text-base font-semibold text-foreground">I'm a Student</span>
                  <span className="text-xs text-muted-foreground text-center">Take exams, track progress, and improve skills</span>
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
                  Log in
                </button>
              </p>
            </div>
          )}

          {/* Signup Form */}
          {mode === "signup" && (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMode("select")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign up as a <span className="capitalize text-primary font-medium">{role}</span>
                  </p>
                </div>
              </div>

              {authError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Input placeholder="Full Name" className="h-11" {...signupForm.register("name")} />
                  {signupForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Input type="email" placeholder="Email Address" className="h-11" {...signupForm.register("email")} />
                  {signupForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="h-11 pr-10"
                    {...signupForm.register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {signupForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <Input type="password" placeholder="Confirm Password" className="h-11" {...signupForm.register("confirmPassword")} />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={signupForm.formState.isSubmitting}>
                {signupForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or sign up with</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-10 gap-2" onClick={handleSocialLogin}>
                  <GoogleIcon /> Google
                </Button>
                <Button type="button" variant="outline" className="h-10 gap-2" onClick={handleSocialLogin}>
                  <GithubIcon /> GitHub
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setAuthError(""); setMode("login"); }} className="font-medium text-primary hover:underline">
                  Log in
                </button>
              </p>
            </form>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMode("select")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                  <p className="text-sm text-muted-foreground">Log in to your account</p>
                </div>
              </div>

              {authError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Input type="email" placeholder="Email Address" className="h-11" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="h-11 pr-10"
                    {...loginForm.register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">Forgot Password?</button>
              </div>

              <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Log In
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-10 gap-2" onClick={handleSocialLogin}>
                  <GoogleIcon /> Google
                </Button>
                <Button type="button" variant="outline" className="h-10 gap-2" onClick={handleSocialLogin}>
                  <GithubIcon /> GitHub
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("select")} className="font-medium text-primary hover:underline">
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* Forgot Password */}
          {mode === "forgot" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                  <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
                </div>
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                className="h-11"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <Button onClick={handleForgotPassword} className="h-11 w-full text-base font-semibold">
                Send Reset Link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          By continuing, you agree to our{" "}
          <button onClick={() => setTermsOpen(true)} className="underline hover:text-white/60">Terms of Service</button>
          {" "}and{" "}
          <button onClick={() => setPrivacyOpen(true)} className="underline hover:text-white/60">Privacy Policy</button>
        </p>
      </div>

      {/* Terms Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Terms of Service</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2 max-h-64 overflow-y-auto">
            <p>Welcome to Kernel. By using our platform, you agree to these terms.</p>
            <p>1. You must be at least 13 years old to use Kernel.</p>
            <p>2. You are responsible for maintaining the security of your account.</p>
            <p>3. Academic honesty is expected during all exams.</p>
            <p>4. We reserve the right to suspend accounts that violate our policies.</p>
            <p>5. Your data is handled according to our Privacy Policy.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Privacy Policy</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2 max-h-64 overflow-y-auto">
            <p>Kernel respects your privacy and is committed to protecting your data.</p>
            <p>1. We collect only the information necessary to provide our services.</p>
            <p>2. Your exam data and results are stored securely.</p>
            <p>3. We do not sell your personal information to third parties.</p>
            <p>4. You can request deletion of your data at any time.</p>
            <p>5. We use cookies for authentication and preferences only.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default AuthPage;
