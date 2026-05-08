import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";

const callouts = [
  { k: "01", t: "Question bank", d: "Reuse coding, MCQ, and written items across exams. Tag and folder them." },
  { k: "02", t: "Per-question controls", d: "Points, time limits, hints, language, sample tests — all editable inline." },
  { k: "03", t: "Draft → publish", d: "Hold the exam in draft. Set a start time. Publish when ready." },
];

const WorkflowMock = () => (
  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
      </div>
      <span className="text-xs font-mono text-muted-foreground">exam-builder · midterm</span>
    </div>
    <div className="grid grid-cols-12 min-h-[280px]">
      <div className="col-span-4 border-r border-border bg-muted/20 p-3 space-y-2 text-xs">
        <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Questions</div>
        {[
          { n: "Q1", t: "Two-pointer pairs", k: "coding" },
          { n: "Q2", t: "Time complexity", k: "mcq" },
          { n: "Q3", t: "Explain divisor sieve", k: "written" },
          { n: "Q4", t: "Maximum subarray", k: "coding" },
        ].map((q, i) => (
          <div
            key={q.n}
            className={`rounded-md border px-2.5 py-2 ${
              i === 0 ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{q.n}</span>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">{q.k}</span>
            </div>
            <div className="text-muted-foreground truncate">{q.t}</div>
          </div>
        ))}
      </div>
      <div className="col-span-8 p-4 space-y-3 text-xs">
        <div>
          <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Title</div>
          <div className="mt-1 rounded-md border border-border/80 bg-card px-3 py-2">Two-pointer pairs</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Points</div>
            <div className="mt-1 rounded-md border border-border/80 bg-card px-3 py-2">10</div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Time</div>
            <div className="mt-1 rounded-md border border-border/80 bg-card px-3 py-2">2s</div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Language</div>
            <div className="mt-1 rounded-md border border-border/80 bg-card px-3 py-2">python3</div>
          </div>
        </div>
        <div>
          <div className="font-mono uppercase tracking-widest text-muted-foreground text-[10px]">Tests</div>
          <div className="mt-1 rounded-md border border-border/80 bg-card divide-y divide-border/60">
            <div className="px-3 py-1.5 flex justify-between font-mono">
              <span className="text-muted-foreground">tests/01.in</span>
              <span className="text-primary">sample</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between font-mono">
              <span className="text-muted-foreground">tests/02.in</span>
              <span className="text-muted-foreground">hidden</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between font-mono">
              <span className="text-muted-foreground">tests/03.in</span>
              <span className="text-muted-foreground">hidden</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Workflow = () => {
  return (
    <SectionShell id="workflow" tone="muted">
      <Reveal>
        <EyebrowLabel>Builder</EyebrowLabel>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight max-w-[640px]">
          A focused exam builder, no spreadsheet required.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start">
        <div className="md:col-span-5 space-y-6">
          {callouts.map((c, i) => (
            <Reveal key={c.k} delay={i * 80}>
              <div className="border-l-2 border-primary/50 pl-4">
                <span className="text-xs font-mono text-primary tracking-widest">{c.k}</span>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{c.t}</h3>
                <p className="mt-1 text-muted-foreground text-[15px] leading-relaxed">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={150} className="md:col-span-7">
          <WorkflowMock />
        </Reveal>
      </div>
    </SectionShell>
  );
};

export default Workflow;
