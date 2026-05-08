import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";
import { howItWorks } from "../content";

const HowItWorks = () => {
  return (
    <SectionShell id="how" tone="muted">
      <Reveal>
        <EyebrowLabel>How it works</EyebrowLabel>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight max-w-[640px]">
          From blank exam to graded result, in three steps.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {howItWorks.map((s, i) => (
          <Reveal key={s.step} delay={i * 80}>
            <div className="rounded-lg border border-border bg-card p-6 h-full">
              <span className="text-xs font-mono text-primary tracking-widest">{s.step}</span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed text-[15px]">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
};

export default HowItWorks;
