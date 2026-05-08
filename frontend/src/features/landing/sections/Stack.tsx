import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";
import { stack } from "../content";

const Stack = () => {
  return (
    <SectionShell id="stack" tone="muted" size="tight">
      <Reveal>
        <EyebrowLabel>Stack</EyebrowLabel>
        <p className="mt-4 font-mono text-base md:text-lg text-foreground/90 flex flex-wrap items-center gap-x-3 gap-y-1">
          {stack.map((t, i) => (
            <span key={t} className="inline-flex items-center gap-3">
              <span className="hover:text-primary transition-colors">{t}</span>
              {i < stack.length - 1 && <span className="text-muted-foreground">·</span>}
            </span>
          ))}
        </p>
      </Reveal>
    </SectionShell>
  );
};

export default Stack;
