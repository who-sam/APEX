import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { login, signup } from "@/lib/api";
import authHero from "@/assets/auth-hero.jpg";
import authBg from "@/assets/auth-bg.jpg";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = isLogin
        ? await login(email, password)
        : await signup(email, password, name, role);

      setAuth(res.token, res.user);
      navigate(res.user.role === "teacher" ? "/teacher" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
      <img src={authBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex w-full max-w-6xl min-h-[70vh] overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-card/90 backdrop-blur-sm">
        {/* Left Panel - Form */}
        <div className="flex w-full flex-col justify-between bg-card p-10 md:w-[45%]">
          <div>
            <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">
              Kernel
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="my-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isLogin ? "Welcome back" : "Sign up"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isLogin
                  ? "Log in to your Kernel account."
                  : "Create your Kernel account to get started."}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="h-12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                  className="h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Password" : "Create Password"}
                  className="h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "student" | "teacher")}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button className="h-12 w-full text-base font-semibold" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Log In"
                : "Create Account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

        {/* Right Panel - Hero Image */}
        <div className="relative hidden md:block md:w-[55%]">
          <img
            src={authHero}
            alt="Retro computer on hillside at sunset"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
