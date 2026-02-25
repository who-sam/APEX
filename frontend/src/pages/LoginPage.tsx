import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "../api";
import { useAuth } from "../hooks/useAuth";
import authHero from "@/assets/auth-hero.jpg";
import authBg from "@/assets/auth-bg.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.token, res.user);
      navigate(res.user.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
      {/* Full-page background wallpaper with dark tint */}
      <img src={authBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex w-full max-w-6xl min-h-[50vh] overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-card/90 backdrop-blur-sm">
        {/* Left Panel - Form */}
        <div className="flex w-full flex-col justify-between bg-card p-10 md:w-[45%]">
          <div>
            <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">
              <span className="text-accent">&lt;/&gt;</span> CodeJudge
            </h2>
          </div>

          <div className="my-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Log in to your CodeJudge account.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter Email"
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Enter Password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't Have An Account?{" "}
            <Link
              to="/signup"
              className="font-medium text-accent hover:underline"
            >
              Sign up
            </Link>
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
}
