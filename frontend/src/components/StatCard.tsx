import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  positive,
  period,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  period: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        variant === "primary"
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-sm font-medium ${
            variant === "primary"
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          }`}
        >
          {title}
        </span>
        <Icon
          size={18}
          className={
            variant === "primary"
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          }
        />
      </div>
      <p
        className={`text-2xl font-bold ${
          variant === "primary" ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {positive ? (
          <ArrowUpRight
            size={14}
            className={
              variant === "primary"
                ? "text-primary-foreground/80"
                : "text-success"
            }
          />
        ) : (
          <ArrowDownRight
            size={14}
            className={
              variant === "primary"
                ? "text-primary-foreground/80"
                : "text-destructive"
            }
          />
        )}
        <span
          className={`text-xs font-medium ${
            variant === "primary"
              ? "text-primary-foreground/80"
              : positive
                ? "text-success"
                : "text-destructive"
          }`}
        >
          {change}
        </span>
        <span
          className={`text-xs ${
            variant === "primary"
              ? "text-primary-foreground/60"
              : "text-muted-foreground"
          }`}
        >
          {period}
        </span>
      </div>
    </div>
  );
}
