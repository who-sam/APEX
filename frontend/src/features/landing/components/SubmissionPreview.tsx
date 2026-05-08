import { heroCodeLines, heroTests } from "../content";
import { cn } from "@/lib/utils";

const toneClass = (tone: string) => {
  switch (tone) {
    case "kw":
      return "text-primary";
    case "fn":
      return "text-foreground font-semibold";
    case "var":
      return "text-foreground/85";
    case "str":
      return "text-primary/80";
    case "muted":
      return "text-muted-foreground italic";
    default:
      return "text-foreground/70";
  }
};

const SubmissionPreview = () => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-sm font-semibold">solution.py</span>
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">midterm · q3</span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
          6 / 8 passed
        </span>
      </div>

      <pre className="px-5 py-4 font-mono text-[13px] leading-6 bg-muted/20 border-b border-border overflow-x-auto">
        {heroCodeLines.map((line, i) => (
          <div key={i} className="flex">
            <span className="select-none w-8 text-right pr-3 text-muted-foreground/60">{i + 1}</span>
            <code>
              {line.map((t, j) => (
                <span key={j} className={cn(toneClass(t.tone))}>
                  {t.text}
                </span>
              ))}
            </code>
          </div>
        ))}
      </pre>

      <div className="divide-y divide-border/60 font-mono text-[13px]">
        {heroTests.map((t) => (
          <div key={t.n} className="flex items-center gap-3 sm:gap-4 px-5 py-2.5">
            <span className="text-muted-foreground w-14 sm:w-16">test_{t.n}</span>
            <span
              className={cn(
                "w-12 sm:w-14 text-xs font-semibold",
                t.ok ? "text-primary" : "text-destructive",
              )}
            >
              {t.ok ? "PASS" : "FAIL"}
            </span>
            <span className="text-muted-foreground w-10 sm:w-12">{t.ms}</span>
            <span className="text-muted-foreground truncate">{t.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionPreview;
