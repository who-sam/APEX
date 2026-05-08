import ApexLogo from "@/components/ApexLogo";
import { contactEmail, githubUrl } from "../content";

const LandingFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border/60 bg-background">
      <div className="mx-auto max-w-[960px] px-4 md:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ApexLogo className="h-5 w-5" />
            <span className="font-semibold text-foreground">APEX</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Exam, grading, and live-coding portal for classrooms.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Links</div>
          <ul className="space-y-2 text-foreground/85">
            <li>
              <a href="#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="#workflow" className="hover:text-foreground">
                Workflow
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-foreground">
                FAQ
              </a>
            </li>
            {githubUrl && (
              <li>
                <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
                  GitHub
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Contact</div>
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="text-foreground/85 hover:text-foreground break-all"
            >
              {contactEmail}
            </a>
          ) : (
            <p className="text-muted-foreground">Reach out via your institution.</p>
          )}
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-[960px] px-4 md:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
          <span>© {year} APEX</span>
          <span>Built with Go · React · Judge0</span>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
