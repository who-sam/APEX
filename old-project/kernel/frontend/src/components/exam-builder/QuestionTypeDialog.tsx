import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Code2, CheckSquare, FileText } from "lucide-react";
import type { QuestionType } from "@/types/exam";

const types: { type: QuestionType; icon: React.ElementType; label: string; desc: string }[] = [
  { type: "coding", icon: Code2, label: "Coding Problem", desc: "Students write and run code" },
  { type: "mcq", icon: CheckSquare, label: "Multiple Choice", desc: "Students select from options" },
  { type: "written", icon: FileText, label: "Written / Short Answer", desc: "Students type a text response" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: QuestionType) => void;
}

export default function QuestionTypeDialog({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {types.map((t) => (
            <button
              key={t.type}
              onClick={() => { onSelect(t.type); onClose(); }}
              className="flex items-center gap-4 rounded-lg border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
