import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronUp, ImagePlus, X, BookmarkPlus } from "lucide-react";
import { useTheme } from "next-themes";
import type { CodingQuestion, Difficulty } from "@/features/exams/types/exam";

const LANGUAGES = ["python", "javascript", "c", "cpp"];

interface Props {
  question: CodingQuestion;
  onChange: (q: CodingQuestion) => void;
  onSaveToBank?: (q: CodingQuestion) => void;
}

export default function CodingEditor({ question, onChange, onSaveToBank }: Props) {
  const update = (partial: Partial<CodingQuestion>) => onChange({ ...question, ...partial });
  const [lang, setLang] = useState("python");
  const [expandedTC, setExpandedTC] = useState<string | null>(null);
  const { theme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ imageUrl: URL.createObjectURL(file) });
  };

  const addTestCase = () => {
    const newTC = { id: crypto.randomUUID(), input: "", expectedOutput: "", isSample: true, points: 0 };
    update({ testCases: [...question.testCases, newTC] });
    setExpandedTC(newTC.id);
  };

  const duplicateTestCase = (tc: typeof question.testCases[0]) => {
    const dup = { ...tc, id: crypto.randomUUID(), isSample: false };
    update({ testCases: [...question.testCases, dup] });
  };

  const removeTestCase = (id: string) => {
    update({ testCases: question.testCases.filter((t) => t.id !== id) });
    if (expandedTC === id) setExpandedTC(null);
  };

  const updateTC = (id: string, partial: Partial<typeof question.testCases[0]>) => {
    update({
      testCases: question.testCases.map((tc) => (tc.id === id ? { ...tc, ...partial } : tc)),
    });
  };

  const distributePointsEvenly = () => {
    const count = question.testCases.length;
    if (count === 0) return;
    const perCase = Math.floor(question.points / count);
    const remainder = question.points % count;
    update({
      testCases: question.testCases.map((tc, i) => ({
        ...tc,
        points: perCase + (i < remainder ? 1 : 0),
      })),
    });
  };

  const totalTCPoints = question.testCases.reduce((a, tc) => a + (tc.points || 0), 0);
  const sampleCount = question.testCases.filter((tc) => tc.isSample).length;
  const hiddenCount = question.testCases.length - sampleCount;

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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Problem Title</label>
          <Input value={question.text} onChange={(e) => update({ text: e.target.value })} placeholder="e.g. Two Sum" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea value={question.description} onChange={(e) => update({ description: e.target.value })} placeholder="Problem description (Markdown)..." rows={4} />
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Total Points</label>
          <Input type="number" value={question.points} onChange={(e) => update({ points: Number(e.target.value) })} min={1} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Time Limit (ms)</label>
          <Input type="number" value={question.timeLimitMs} onChange={(e) => update({ timeLimitMs: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Memory Limit (KB)</label>
          <Input type="number" value={question.memoryLimitKb} onChange={(e) => update({ memoryLimitKb: Number(e.target.value) })} />
        </div>
      </div>

      {/* Starter Code */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Starter Code</label>
        <Tabs value={lang} onValueChange={setLang}>
          <TabsList className="bg-muted/50">
            {LANGUAGES.map((l) => (
              <TabsTrigger key={l} value={l} className="text-xs capitalize">{l === "cpp" ? "C++" : l}</TabsTrigger>
            ))}
          </TabsList>
          {LANGUAGES.map((l) => (
            <TabsContent key={l} value={l} className="mt-2">
              <div className="rounded-lg border border-border overflow-hidden h-48">
                <Editor
                  height="100%"
                  language={l === "cpp" ? "cpp" : l}
                  value={question.starterCode[l] || ""}
                  onChange={(v) => update({ starterCode: { ...question.starterCode, [l]: v || "" } })}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 8 } }}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Test Cases — Enhanced */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{sampleCount} sample</Badge>
              <Badge variant="outline" className="text-xs">{hiddenCount} hidden</Badge>
              <Badge variant={totalTCPoints === question.points ? "default" : "destructive"} className="text-xs">
                {totalTCPoints}/{question.points} pts
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addTestCase}>
              <Plus className="h-3.5 w-3.5" /> Add Test Case
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={distributePointsEvenly}>
              Distribute Points Evenly
            </Button>
          </div>

          {question.testCases.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No test cases yet. Add one to get started.</p>
          )}

          {question.testCases.map((tc, i) => {
            const isExpanded = expandedTC === tc.id;
            return (
              <div key={tc.id} className="rounded-lg border border-border bg-secondary/20">
                {/* Header row */}
                <button
                  onClick={() => setExpandedTC(isExpanded ? null : tc.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary/30 transition-colors rounded-lg"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs font-medium text-foreground flex-1">
                    Test Case {i + 1}
                    {tc.isSample && <Badge variant="outline" className="ml-2 text-[10px] py-0">Sample</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">{tc.points || 0} pts</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Input</label>
                        <Textarea
                          placeholder="e.g. [2,7,11,15]\n9"
                          value={tc.input}
                          onChange={(e) => updateTC(tc.id, { input: e.target.value })}
                          className="text-xs font-mono"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Expected Output</label>
                        <Textarea
                          placeholder="e.g. [0,1]"
                          value={tc.expectedOutput}
                          onChange={(e) => updateTC(tc.id, { expectedOutput: e.target.value })}
                          className="text-xs font-mono"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Points</label>
                        <Input
                          type="number"
                          value={tc.points || 0}
                          onChange={(e) => updateTC(tc.id, { points: Number(e.target.value) })}
                          className="h-7 w-20 text-xs"
                          min={0}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={tc.isSample}
                          onCheckedChange={(v) => updateTC(tc.id, { isSample: v })}
                        />
                        <span className="text-xs text-muted-foreground">Visible to students</span>
                      </div>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => duplicateTestCase(tc)}>
                        <Copy className="h-3 w-3" /> Duplicate
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTestCase(tc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Hints</label>
        <Textarea value={question.hints} onChange={(e) => update({ hints: e.target.value })} placeholder="Optional hints for students..." rows={2} />
      </div>
    </div>
  );
}
