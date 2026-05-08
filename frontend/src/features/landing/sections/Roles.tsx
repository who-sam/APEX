import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";
import { studentBullets, teacherBullets } from "../content";

const RoleCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-lg border border-border bg-card p-6 md:p-8 h-full">
    <h3 className="text-xs font-mono uppercase tracking-widest text-primary">{title}</h3>
    <ul className="mt-6 space-y-1">
      {items.map((b) => (
        <li
          key={b}
          className="text-[15px] text-foreground/85 leading-relaxed border-l-2 border-transparent hover:border-primary/40 pl-3 -ml-3 py-1 transition-colors"
        >
          {b}
        </li>
      ))}
    </ul>
  </div>
);

const Roles = () => {
  return (
    <SectionShell id="roles">
      <Reveal>
        <EyebrowLabel>Built for both sides</EyebrowLabel>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight max-w-[640px]">
          One portal. Two workflows.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <Reveal>
          <RoleCard title="For teachers" items={teacherBullets} />
        </Reveal>
        <Reveal delay={100}>
          <RoleCard title="For students" items={studentBullets} />
        </Reveal>
      </div>
    </SectionShell>
  );
};

export default Roles;
