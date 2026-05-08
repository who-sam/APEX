import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import EyebrowLabel from "../components/EyebrowLabel";
import Reveal from "../components/Reveal";
import SectionShell from "../components/SectionShell";
import { faq } from "../content";

const FAQ = () => {
  return (
    <SectionShell id="faq">
      <Reveal>
        <EyebrowLabel>FAQ</EyebrowLabel>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight max-w-[640px]">
          Common questions.
        </h2>
      </Reveal>
      <Reveal delay={80} className="mt-10">
        <Accordion type="single" collapsible className="rounded-lg border border-border bg-card divide-y divide-border/60">
          {faq.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-b-0 px-5">
              <AccordionTrigger className="text-left text-base md:text-lg font-medium tracking-tight hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </SectionShell>
  );
};

export default FAQ;
