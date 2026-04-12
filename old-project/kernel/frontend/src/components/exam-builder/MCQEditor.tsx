import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MCQQuestion, Difficulty } from "@/types/exam";

interface Props {
  question: MCQQuestion;
  onChange: (q: MCQQuestion) => void;
}

export default function MCQEditor({ question, onChange }: Props) {
  const { toast } = useToast();
  const update = (partial: Partial<MCQQuestion>) => onChange({ ...question, ...partial });

  const addOption = () => {
    if (question.options.length >= 6) return;
    update({ options: [...question.options, { id: crypto.randomUUID(), text: "" }] });
  };

  const removeOption = (id: string) => {
    update({
      options: question.options.filter((o) => o.id !== id),
      correctOptionIds: question.correctOptionIds.filter((cid) => cid !== id),
    });
  };

  const toggleCorrect = (id: string) => {
    if (question.multipleCorrect) {
      const ids = question.correctOptionIds.includes(id)
        ? question.correctOptionIds.filter((c) => c !== id)
        : [...question.correctOptionIds, id];
      update({ correctOptionIds: ids });
    } else {
      update({ correctOptionIds: [id] });
    }
  };

  return (
    <div className="space-y-5 p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Question Text</label>
          <Textarea value={question.text} onChange={(e) => update({ text: e.target.value })} placeholder="Enter the question..." rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Points</label>
          <Input type="number" value={question.points} onChange={(e) => update({ points: Number(e.target.value) })} min={1} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty</label>
          <Select value={question.difficulty} onValueChange={(v) => update({ difficulty: v as Difficulty })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={question.multipleCorrect} onCheckedChange={(v) => {
          if (question.correctOptionIds.length > 0) {
            toast({ title: "Correct answers cleared", description: "Toggling answer mode resets selected correct answers." });
          }
          update({ multipleCorrect: v, correctOptionIds: [] });
        }} />
        <span className="text-sm text-muted-foreground">Allow multiple correct answers</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Options</label>
        {question.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCorrect(opt.id)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                question.correctOptionIds.includes(opt.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </button>
            <Input
              value={opt.text}
              onChange={(e) => {
                const opts = [...question.options];
                opts[i] = { ...opts[i], text: e.target.value };
                update({ options: opts });
              }}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="flex-1"
            />
            {question.options.length > 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(opt.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {question.options.length < 6 && (
          <Button variant="outline" size="sm" className="gap-1 mt-1" onClick={addOption}>
            <Plus className="h-3.5 w-3.5" /> Add Option
          </Button>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Explanation (shown after grading)</label>
        <Textarea value={question.explanation} onChange={(e) => update({ explanation: e.target.value })} placeholder="Explain the correct answer..." rows={2} />
      </div>
    </div>
  );
}
