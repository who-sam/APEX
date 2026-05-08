import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Reveal from "../components/Reveal";

const CTA = () => {
  return (
    <section className="w-full bg-primary/5 border-y border-primary/20">
      <div className="mx-auto max-w-[960px] px-4 md:px-6 lg:px-8 py-20 md:py-24 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] max-w-[720px] mx-auto">
            Ready to run your next exam?
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-[560px] mx-auto leading-relaxed">
            Sign up, build a class, hand out the invite code. Students take the exam, code grades itself.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTA;
