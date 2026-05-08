import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  tone?: "default" | "muted";
  size?: "default" | "tight";
  children: React.ReactNode;
  className?: string;
}

const SectionShell = ({ id, tone = "default", size = "default", children, className }: Props) => {
  const bg = tone === "muted" ? "bg-muted/30" : "bg-background";
  const padding = size === "tight" ? "py-16 md:py-20" : "py-20 md:py-28";
  return (
    <section id={id} className={cn("w-full", bg)}>
      <div className={cn("mx-auto max-w-[960px] px-4 md:px-6 lg:px-8", padding, className)}>{children}</div>
    </section>
  );
};

export default SectionShell;
