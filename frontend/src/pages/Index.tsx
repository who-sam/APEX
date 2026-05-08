import { Link, Navigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon, Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApexLogo from "@/components/ApexLogo";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const tests = [
    { n: 1, ok: true, ms: "2ms", note: "" },
    { n: 2, ok: true, ms: "3ms", note: "" },
    { n: 3, ok: false, ms: "1ms", note: 'expected "3"  got "2"' },
    { n: 4, ok: true, ms: "1ms", note: "" },
    { n: 5, ok: true, ms: "2ms", note: "" },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 bg-pattern opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background pointer-events-none" />

      <div className="relative z-10">
        <header className="border-b border-border/60 backdrop-blur-sm">
          <div className="mx-auto max-w-[960px] px-6 flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-2">
              <ApexLogo className="h-7 w-7" />
              <span className="text-lg font-bold tracking-tight">APEX</span>
            </Link>
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <a href="https://github.com" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-[960px] px-6">
          {/* Hero */}
          <section className="pt-24 pb-24">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/60 text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              A Portal for Exams
            </span>
            <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] max-w-[820px]">
              Exams for code, written, and multiple choice.{" "}
              <span className="text-primary">Graded automatically.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-[680px] leading-relaxed">
              APEX runs timed exams in a Monaco editor, executes student code in a sandbox, and routes
              written answers to a teacher grading queue.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="gap-2">
                <a href="https://github.com" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> View on GitHub
                </a>
              </Button>
            </div>

            {/* Submission preview panel */}
            <div className="mt-14 rounded-xl border border-border bg-card/70 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Submission · solution.py</span>
                  <span className="text-xs font-mono text-muted-foreground">midterm · q3</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  6 / 8 passed
                </span>
              </div>
              <div className="divide-y divide-border/60 font-mono text-[13px]">
                {tests.map((t) => (
                  <div key={t.n} className="flex items-center gap-4 px-5 py-2.5">
                    <span className="text-muted-foreground w-16">test_{t.n}</span>
                    <span className={`w-14 text-xs font-semibold ${t.ok ? "text-primary" : "text-destructive"}`}>
                      {t.ok ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-muted-foreground w-12">{t.ms}</span>
                    <span className="text-muted-foreground truncate">{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* What it does */}
          <section className="py-24 border-t border-border/60">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-12">
              What it does
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { t: "Build exams.", d: "Coding, MCQ, written. Per-question points, time limits, hints, tags. Reusable question bank." },
                { t: "Auto-grade code.", d: "Judge0 sandbox runs each test case. Output normalized and diffed. Score = passed / total." },
                { t: "Manual grading queue.", d: "Written answers route to teacher. Score override and feedback per submission." },
              ].map((c) => (
                <div key={c.t} className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-primary/40 transition-colors">
                  <div className="font-semibold text-foreground mb-2">{c.t}</div>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* For teachers / students */}
          <section className="py-24 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-8">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary mb-6">For teachers</h3>
                <ul className="space-y-3 text-[15px] text-foreground/85 leading-relaxed">
                  <li>— Class invite codes</li>
                  <li>— Draft and publish exams</li>
                  <li>— Assign to multiple classes</li>
                  <li>— Results explorer</li>
                  <li>— Pending grading queue</li>
                  <li>— Announcements with attachments</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-8">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary mb-6">For students</h3>
                <ul className="space-y-3 text-[15px] text-foreground/85 leading-relaxed">
                  <li>— Join by 8-character code</li>
                  <li>— Timed attempts with autosave and resume</li>
                  <li>— Monaco editor</li>
                  <li>— Sample-test feedback</li>
                  <li>— Per-test result breakdown</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Stack */}
          <section className="py-24 border-t border-border/60">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Stack</h3>
            <p className="font-mono text-[15px] text-foreground/90">
              Go <span className="text-muted-foreground">·</span> Gin{" "}
              <span className="text-muted-foreground">·</span> PostgreSQL{" "}
              <span className="text-muted-foreground">·</span> React{" "}
              <span className="text-muted-foreground">·</span> Vite{" "}
              <span className="text-muted-foreground">·</span> Judge0{" "}
              <span className="text-muted-foreground">·</span> JWT
            </p>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/60 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ApexLogo className="h-5 w-5" />
              <span className="font-semibold text-foreground">APEX</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
              <a href="mailto:hello@apex.dev" className="hover:text-foreground">hello@apex.dev</a>
            </div>
            <div className="font-mono text-xs">© {new Date().getFullYear()} APEX</div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Index;
