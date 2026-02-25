export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  period?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "primary" | "accent";
}) {
  const isPrimary = variant === "primary";
  const isAccent = variant === "accent";
  const highlighted = isPrimary || isAccent;

  return (
    <div
      className={`rounded-xl border p-5 ${
        isPrimary
          ? "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : isAccent
            ? "border-accent/30 bg-accent text-accent-foreground shadow-lg shadow-accent/20"
            : "border-border/50 bg-card/80 backdrop-blur-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-medium ${
            highlighted ? "opacity-90" : "text-muted-foreground"
          }`}
        >
          {title}
        </p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            highlighted ? "bg-white/20" : "bg-secondary"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              highlighted ? "text-current" : "text-foreground"
            }`}
          />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p
        className={`mt-1 text-xs ${
          highlighted ? "opacity-75" : "text-muted-foreground"
        }`}
      >
        {change}
      </p>
    </div>
  );
}
