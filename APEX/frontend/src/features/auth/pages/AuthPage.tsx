import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import authBg from "@/assets/auth-bg.jpg";
import authBgLight from "@/assets/auth-bg-light.jpg";
import authHero from "@/assets/auth-hero.jpg";
import authHeroLight from "@/assets/auth-hero-light.jpg";
import ApexLogo from "@/components/ApexLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";

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

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "student", middleName: "" },
  });

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

            {/* Signup Form */}
            {mode === "signup" && (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                  <p className="text-sm text-muted-foreground mt-1">Get started with APEX</p>
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
