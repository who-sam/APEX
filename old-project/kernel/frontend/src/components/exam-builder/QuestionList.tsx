import { Button } from "@/components/ui/button";
import { Code2, CheckSquare, FileText, Plus, Trash2 } from "lucide-react";
import type { Question } from "@/types/exam";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  coding: Code2,
  mcq: CheckSquare,
  written: FileText,
};

interface Props {
  questions: Question[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
}

export default function QuestionList({ questions, selectedIndex, onSelect, onAdd, onDelete }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Questions ({questions.length})</h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {questions.map((q, i) => {
          const Icon = typeIcons[q.type];
          return (
            <div
              key={q.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                i === selectedIndex ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => onSelect(i)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm truncate">
                Q{i + 1}: {q.text || q.type.toUpperCase()}
              </span>
              <span className="text-xs opacity-60">{q.points}pts</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No questions yet. Click "Add" to start.
          </p>
        )}
      </div>
    </div>
  );
}
