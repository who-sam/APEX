import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Reveal = ({ children, delay = 0, className, as = "div" }: Props) => {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced()) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "-10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as keyof JSX.IntrinsicElements;
  return (
    // @ts-expect-error polymorphic ref
    <Tag
      ref={ref}
      style={{ transitionDelay: shown && delay ? `${delay}ms` : undefined }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
