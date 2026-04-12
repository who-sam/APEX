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

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Write your code here\nprint("Hello, World!")`,
  javascript: `// Write your code here\nconsole.log("Hello, World!");`,
  typescript: `// Write your code here\nconsole.log("Hello, World!");`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
};

export default function CodeEditorPage() {
  const { theme } = useTheme();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE["python"]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [codeStore, setCodeStore] = useState<Record<string, string>>({ ...DEFAULT_CODE });

  const handleLanguageChange = (lang: string) => {
    // Save current code
    setCodeStore((prev) => ({ ...prev, [language]: code }));
    setLanguage(lang);
    setCode(codeStore[lang] || DEFAULT_CODE[lang] || "");
  };

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setOutput("");
    // Mock compilation/execution
    setTimeout(() => {
      const lines: string[] = [];
      lines.push(`[${LANGUAGES.find(l => l.value === language)?.label}] Compiling...`);
      lines.push(`[${LANGUAGES.find(l => l.value === language)?.label}] Running...`);
      lines.push("");

      // Simple mock output based on language
      if (code.includes("Hello, World") || code.includes("Hello, World!")) {
        lines.push("Hello, World!");
      } else if (code.includes("print") || code.includes("console.log") || code.includes("cout") || code.includes("printf") || code.includes("println")) {
        lines.push("Program executed successfully.");
      } else {
        lines.push("Program executed with no output.");
      }

      if (input.trim()) {
        lines.push("");
        lines.push(`--- Input received (${input.split("\n").length} line(s)) ---`);
      }

      lines.push("");
      lines.push(`Process finished with exit code 0`);
      lines.push(`Execution time: ${Math.floor(Math.random() * 50 + 5)}ms | Memory: ${Math.floor(Math.random() * 5 + 2)}MB`);

      setOutput(lines.join("\n"));
      setIsRunning(false);
    }, 1200);
  }, [code, input, language]);

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
                language={language === "cpp" ? "cpp" : language}
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
