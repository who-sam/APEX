import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Github, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ApexLogo from "@/components/ApexLogo";
import { cn } from "@/lib/utils";
import { githubUrl, navAnchors } from "../content";

const LandingHeader = () => {
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[padding,box-shadow,border-color] duration-200",
        scrolled
          ? "border-border/80 shadow-[0_1px_0_0_hsl(var(--border)/0.6)] supports-[backdrop-filter]:bg-background/75 supports-[backdrop-filter]:backdrop-blur"
          : "border-transparent bg-background/0",
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[960px] px-4 md:px-6 lg:px-8 flex items-center justify-between",
          scrolled ? "py-3" : "py-4",
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          <ApexLogo className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight">APEX</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navAnchors.map((a) => (
            <a key={a.href} href={a.href} className="hover:text-foreground transition-colors">
              {a.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {githubUrl && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
            >
              <a href={githubUrl} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" /> GitHub
              </a>
            </Button>
          )}

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-6 text-base">
                {navAnchors.map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="text-foreground/85 hover:text-foreground"
                  >
                    {a.label}
                  </a>
                ))}
                <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
                  {githubUrl && (
                    <Button asChild variant="ghost" className="justify-start">
                      <a href={githubUrl} target="_blank" rel="noreferrer">
                        <Github className="h-4 w-4" /> GitHub
                      </a>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
