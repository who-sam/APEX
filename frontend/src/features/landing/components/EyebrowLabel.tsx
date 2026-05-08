import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  tone?: "muted" | "primary";
  withDot?: boolean;
}

const EyebrowLabel = ({ children, className, tone = "muted", withDot = false }: Props) => {
  const toneClass = tone === "primary" ? "text-primary" : "text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest",
        toneClass,
        className,
      )}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
};

export default EyebrowLabel;
