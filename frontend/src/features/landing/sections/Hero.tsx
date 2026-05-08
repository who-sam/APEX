import { Link } from "react-router-dom";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SubmissionPreview from "../components/SubmissionPreview";
import { githubUrl } from "../content";

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background pointer-events-none" />

      <div className="relative mx-auto max-w-[960px] px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-24 md:pb-32">
        <Reveal>
          <EyebrowLabel withDot>A Portal for Exams</EyebrowLabel>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] max-w-[820px]">
            Exams for code, written, and multiple choice.{" "}
            <span className="text-primary">Graded automatically.</span>
          </h1>
          <p className="mt-4 md:mt-5 text-base md:text-lg text-muted-foreground max-w-[680px] leading-relaxed">
            APEX runs timed exams in a Monaco editor, executes student code in a sandbox, and routes
            written answers to a teacher grading queue.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
              <Link to="/auth">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {githubUrl && (
              <Button asChild size="lg" variant="ghost" className="gap-2 w-full sm:w-auto">
                <a href={githubUrl} target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> View on GitHub
                </a>
              </Button>
            )}
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-14 md:mt-16">
          <SubmissionPreview />
        </Reveal>
      </div>
    </section>
  );
};

export default Hero;
