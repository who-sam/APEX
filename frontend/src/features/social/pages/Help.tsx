import { HelpCircle, BookOpen, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How do I start a practice exam?", a: "Navigate to the Practice page from the sidebar or top nav. Browse the available exams, filter by category or difficulty, and click 'Start Practice' to begin." },
  { q: "How are exam scores calculated?", a: "Each correct answer earns you points. Your final score is the percentage of correct answers. Skipped questions count as incorrect. Time bonuses may apply for faster completion." },
  { q: "Can I retake an exam?", a: "Yes! You can retake any practice exam as many times as you'd like. Your best score will be recorded in your results history." },
  { q: "How do I join or create a team?", a: "Go to the Team page to view your current team. Team leaders can invite new members via email. Contact your admin if you need to switch teams." },
  { q: "What happens if I lose connection during an exam?", a: "Don't worry — your progress is auto-saved every 30 seconds. When you reconnect, you can resume from where you left off." },
  { q: "How do I change my notification preferences?", a: "Head to Settings → Notifications to toggle email, push, exam reminders, and result alerts on or off." },
];

const resources = [
  { title: "Getting Started Guide", desc: "Learn the basics of APEX", icon: BookOpen, href: "#getting-started" },
  { title: "API Documentation", desc: "For developers building integrations", icon: FileText, href: "#api-docs" },
  { title: "Community Forum", desc: "Connect with other learners", icon: MessageCircle, href: "#community" },
];

export default function HelpPage() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Help & Support</h1>
        <p className="mt-1 text-muted-foreground">Find answers and get assistance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* FAQ */}
        <Card className="xl:col-span-2 border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Resources */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.map((r, i) => (
                <button
                  key={i}
                  onClick={() => toast({ title: "Coming soon", description: `${r.title} documentation is coming soon.` })}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 p-3 hover:bg-secondary/40 transition-colors cursor-pointer w-full text-left"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <r.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 text-center space-y-3">
              <MessageCircle className="h-8 w-8 text-primary mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Still need help?</p>
                <p className="text-sm text-muted-foreground">Our support team is here for you.</p>
              </div>
              <Button className="w-full gap-2" onClick={() => window.location.href = "mailto:support@apex.dev"}>
                <MessageCircle className="h-4 w-4" /> Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
