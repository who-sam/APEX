import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";
import { features } from "../content";

const Features = () => {
  return (
    <SectionShell id="features">
      <Reveal>
        <EyebrowLabel>What it does</EyebrowLabel>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight max-w-[640px]">
          Build, run, grade. End-to-end.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {features.map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <div className="group rounded-lg border border-border bg-card p-6 h-full transition-shadow hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]">
              <div className="font-semibold text-foreground text-lg tracking-tight">{c.title}</div>
              <p className="mt-2 text-muted-foreground leading-relaxed text-[15px]">{c.body}</p>
              <div className="mt-4 pt-4 border-t border-border/60">
                <code className="text-xs font-mono text-primary/90 break-all">{c.example}</code>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
};

export default Features;
