import { useState, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Play, Loader2, Terminal, Code2, ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useExecuteCode } from "@/hooks/useExecuteCode";

const LANGUAGES = [
  { value: "python3", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
];

const DEFAULT_CODE: Record<string, string> = {
  python3: `# Write your code here\nprint("Hello, World!")`,
  javascript: `// Write your code here\nconsole.log("Hello, World!");`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function CodeEditorPage() {
  const { theme } = useTheme();
  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState(DEFAULT_CODE["python3"]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [codeStore, setCodeStore] = useState<Record<string, string>>({ ...DEFAULT_CODE });

  const executeMutation = useExecuteCode();

  const handleLanguageChange = (lang: string) => {
    setCodeStore((prev) => ({ ...prev, [language]: code }));
    setLanguage(lang);
    setCode(codeStore[lang] || DEFAULT_CODE[lang] || "");
  };

  const handleRun = useCallback(() => {
    setOutput("");
    executeMutation.mutate(
      { language, code, stdin: input || undefined },
      {
        onSuccess: (data) => {
          const lines: string[] = [];
          if (data.stdout) lines.push(data.stdout);
          if (data.stderr) {
            lines.push("");
            lines.push("--- stderr ---");
            lines.push(data.stderr);
          }
          if (data.compile_output) {
            lines.push("");
            lines.push("--- Compilation Output ---");
            lines.push(data.compile_output);
          }
          lines.push("");
          lines.push(`Process finished | Time: ${data.time_ms ?? 0}ms | Memory: ${data.memory_kb ? Math.round(data.memory_kb / 1024) + "MB" : "N/A"}`);
          setOutput(lines.join("\n"));
        },
        onError: (err: any) => {
          setOutput(`Error: ${err.message || "Execution failed"}`);
        },
      }
    );
  }, [code, input, language, executeMutation]);

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun]);

  const isRunning = executeMutation.isPending;

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-foreground">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Playground</span>
          </div>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[160px] h-8 rounded-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="gap-2 rounded-full"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>

      {/* Main layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm"
      >
        {/* Code editor panel */}
        <ResizablePanel defaultSize={60} minSize={35}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Code</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">Ctrl+Enter to run</span>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language === "python3" ? "python" : language}
                value={code}
                onChange={(v) => setCode(v || "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel: Input + Output stacked */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            {/* Input */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Input</span>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter input here..."
                  className="flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Output */}
            <ResizablePanel defaultSize={65} minSize={20}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Output</span>
                  {isRunning && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {output ? (
                    <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {output}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-2">
                      <Terminal className="h-8 w-8" />
                      <span className="text-xs">Run your code to see output here</span>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
