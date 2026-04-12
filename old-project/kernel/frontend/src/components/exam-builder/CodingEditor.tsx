import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import type { CodingQuestion, Difficulty } from "@/types/exam";

const LANGUAGES = ["python", "javascript", "c", "cpp"];

interface Props {
  question: CodingQuestion;
  onChange: (q: CodingQuestion) => void;
}

export default function CodingEditor({ question, onChange }: Props) {
  const update = (partial: Partial<CodingQuestion>) => onChange({ ...question, ...partial });
  const [lang, setLang] = useState("python");
  const { theme } = useTheme();

  const addTestCase = () => {
    update({
      testCases: [...question.testCases, { id: crypto.randomUUID(), input: "", expectedOutput: "", isSample: true }],
    });
  };

  const removeTestCase = (id: string) => {
    update({ testCases: question.testCases.filter((t) => t.id !== id) });
  };

  return (
    <div className="space-y-5 p-5 overflow-y-auto h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Problem Title</label>
          <Input value={question.text} onChange={(e) => update({ text: e.target.value })} placeholder="e.g. Two Sum" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea value={question.description} onChange={(e) => update({ description: e.target.value })} placeholder="Problem description (Markdown)..." rows={4} />
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

      {/* Test Cases */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">Test Cases</label>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addTestCase}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {question.testCases.map((tc, i) => (
            <div key={tc.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <Input
                placeholder="Input"
                value={tc.input}
                onChange={(e) => {
                  const tcs = [...question.testCases];
                  tcs[i] = { ...tcs[i], input: e.target.value };
                  update({ testCases: tcs });
                }}
                className="text-xs"
              />
              <Input
                placeholder="Expected Output"
                value={tc.expectedOutput}
                onChange={(e) => {
                  const tcs = [...question.testCases];
                  tcs[i] = { ...tcs[i], expectedOutput: e.target.value };
                  update({ testCases: tcs });
                }}
                className="text-xs"
              />
              <div className="flex items-center gap-1">
                <Switch
                  checked={tc.isSample}
                  onCheckedChange={(v) => {
                    const tcs = [...question.testCases];
                    tcs[i] = { ...tcs[i], isSample: v };
                    update({ testCases: tcs });
                  }}
                />
                <span className="text-xs text-muted-foreground">Sample</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTestCase(tc.id)} aria-label="Remove test case">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Hints</label>
        <Textarea value={question.hints} onChange={(e) => update({ hints: e.target.value })} placeholder="Optional hints for students..." rows={2} />
      </div>
    </div>
  );
}
