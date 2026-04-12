import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X, BookmarkPlus } from "lucide-react";
import type { WrittenQuestion, Difficulty } from "@/features/exams/types/exam";

interface Props {
  question: WrittenQuestion;
  onChange: (q: WrittenQuestion) => void;
  onSaveToBank?: (q: WrittenQuestion) => void;
}

export default function WrittenEditor({ question, onChange, onSaveToBank }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (partial: Partial<WrittenQuestion>) => onChange({ ...question, ...partial });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ imageUrl: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-5 p-5 overflow-y-auto h-full">
      {onSaveToBank && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSaveToBank(question)}>
            <BookmarkPlus className="h-4 w-4" /> Save to Bank
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Question Text</label>
          <Textarea value={question.text} onChange={(e) => update({ text: e.target.value })} placeholder="Enter the question..." rows={3} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Question Image (optional)</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {question.imageUrl ? (
            <div className="relative inline-block">
              <img src={question.imageUrl} alt="Question" className="max-h-40 rounded-lg border border-border" />
              <button
                onClick={() => update({ imageUrl: "" })}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload Image
            </Button>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Points</label>
          <Input type="number" value={question.points} onChange={(e) => update({ points: Number(e.target.value) })} min={1} />
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
