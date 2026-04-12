import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WrittenQuestion, Difficulty } from "@/types/exam";

interface Props {
  question: WrittenQuestion;
  onChange: (q: WrittenQuestion) => void;
}

export default function WrittenEditor({ question, onChange }: Props) {
  const update = (partial: Partial<WrittenQuestion>) => onChange({ ...question, ...partial });

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
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Word Count</label>
          <Input type="number" value={question.maxWordCount} onChange={(e) => update({ maxWordCount: Number(e.target.value) })} min={10} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={question.requireManualGrading} onCheckedChange={(v) => update({ requireManualGrading: v })} />
        <span className="text-sm text-muted-foreground">Require manual grading</span>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Rubric / Grading Criteria</label>
        <Textarea value={question.rubric} onChange={(e) => update({ rubric: e.target.value })} placeholder="Define grading criteria..." rows={4} />
      </div>
    </div>
  );
}
