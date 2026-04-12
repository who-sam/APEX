import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { executeCode, runSolution, submitSolution } from "@/lib/api";
import type { ProblemData, RunResult } from "@/lib/api";

const LANG_MONACO: Record<string, string> = {
  python3: "python",
  javascript: "javascript",
  c: "c",
  cpp: "cpp",
};

const DEFAULT_CODE: Record<string, string> = {
  python3: '# Write your code here\nprint("Hello, World!")\n',
  javascript: '// Write your code here\nconsole.log("Hello, World!");\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
};

interface ConsoleOutput {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: string;
  time: string;
  memory: number;
}

export default function CodeEditorPage() {
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get("problemId");

  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState(DEFAULT_CODE.python3);
  const [bottomTab, setBottomTab] = useState("console");
  const [isRunning, setIsRunning] = useState(false);

  // Stdin state
  const [stdin, setStdin] = useState("");

  // Playground mode state
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput | null>(null);

  // Problem mode state
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [activeTab, setActiveTab] = useState("description");

  const isProblemMode = !!problem;

  // Load problem if problemId is provided
  useEffect(() => {
    if (problemId) {
      // Problem loading would happen here - for now we leave it as playground
    }
  }, [problemId]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (!isProblemMode) {
      setCode(DEFAULT_CODE[lang] || DEFAULT_CODE.python3);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setBottomTab("console");

    if (isProblemMode && problem) {
      // Problem mode: run against sample test cases
      try {
        const res = await runSolution({
          problem_id: problem.id,
          language,
          code,
        });
        setRunResults(res.results);
        setBottomTab("result");
      } catch (err: any) {
        setConsoleOutput({
          stdout: "",
          stderr: err.message || "Error running code",
          compile_output: "",
          status: "Error",
          time: "0",
          memory: 0,
        });
      }
    } else {
      // Playground mode: execute code freely
      try {
        const res = await executeCode(language, code, stdin);
        setConsoleOutput(res);
      } catch (err: any) {
        setConsoleOutput({
          stdout: "",
          stderr: err.message || "Error executing code",
          compile_output: "",
          status: "Error",
          time: "0",
          memory: 0,
        });
      }
    }

    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!isProblemMode || !problem) return;
    setIsRunning(true);
    setBottomTab("result");

    try {
      await submitSolution({
        problem_id: problem.id,
        exam_id: problem.exam_id,
        language,
        code,
      });
      // After submission, run to show results
      const res = await runSolution({
        problem_id: problem.id,
        language,
        code,
      });
      setRunResults(res.results);
    } catch (err: any) {
      setConsoleOutput({
        stdout: "",
        stderr: err.message || "Error submitting",
        compile_output: "",
        status: "Error",
        time: "0",
        memory: 0,
      });
      setBottomTab("console");
    }

    setIsRunning(false);
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {isProblemMode ? `${problem.title}` : "Code Playground"}
          </h2>
          {isProblemMode && (
            <span className={`text-sm font-semibold ${
              problem.difficulty === "easy" ? "text-green-400" :
              problem.difficulty === "medium" ? "text-yellow-400" : "text-red-400"
            }`}>
              {problem.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleRun}
            disabled={isRunning}
          >
            <Play className="h-4 w-4" />
            Run
          </Button>
          {isProblemMode && (
            <Button
              size="sm"
              className="gap-2 rounded-full"
              onClick={handleSubmit}
              disabled={isRunning}
            >
              <Send className="h-4 w-4" />
              Submit
            </Button>
          )}
        </div>
      </div>

      {/* Main split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Left panel — Problem description or info */}
        <ResizablePanel defaultSize={isProblemMode ? 40 : 0} minSize={0}>
          {isProblemMode ? (
            <div className="flex h-full flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-2">
                  <TabsTrigger value="description" className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                    Description
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="flex-1 overflow-y-auto p-5 m-0 space-y-5">
                  <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
                    <p className="whitespace-pre-line">{problem.description}</p>
                  </div>
                  {problem.hints && (
                    <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm">
                      <p className="font-semibold text-foreground mb-1">Hints</p>
                      <p className="text-muted-foreground">{problem.hints}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </ResizablePanel>

        {isProblemMode && <ResizableHandle withHandle />}

        {/* Right panel — Editor + Console */}
        <ResizablePanel defaultSize={isProblemMode ? 60 : 100} minSize={35}>
          <ResizablePanelGroup direction="vertical">
            {/* Code editor */}
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="flex h-full flex-col">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[160px] h-8 rounded-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="python3">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Monaco */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={LANG_MONACO[language]}
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      lineNumbers: "on",
                      renderLineHighlight: "line",
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                      bracketPairColorization: { enabled: true },
                      autoClosingBrackets: "always",
                      tabSize: 4,
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom — Console / Results */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex flex-col h-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-1">
                  <TabsTrigger value="console" className="rounded-full text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1">
                    <Terminal className="h-3 w-3" />
                    Console
                  </TabsTrigger>
                  {!isProblemMode && (
                    <TabsTrigger value="input" className="rounded-full text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1">
                      Input (stdin)
                    </TabsTrigger>
                  )}
                  {isProblemMode && (
                    <TabsTrigger value="result" className="rounded-full text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      Results
                      {runResults && (
                        <span className="ml-1.5">
                          {runResults.every((t) => t.passed) ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 inline" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-400 inline" />
                          )}
                        </span>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="console" className="flex-1 overflow-y-auto p-4 m-0">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Executing code...
                    </div>
                  ) : consoleOutput ? (
                    <div className="space-y-3 font-mono text-xs">
                      {consoleOutput.compile_output && (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-destructive">Compile Output:</p>
                          <pre className="whitespace-pre-wrap text-destructive/80 bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                            {consoleOutput.compile_output}
                          </pre>
                        </div>
                      )}
                      {consoleOutput.stdout && (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">Output:</p>
                          <pre className="whitespace-pre-wrap text-green-400 bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                            {consoleOutput.stdout}
                          </pre>
                        </div>
                      )}
                      {consoleOutput.stderr && (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-destructive">Error:</p>
                          <pre className="whitespace-pre-wrap text-red-400 bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                            {consoleOutput.stderr}
                          </pre>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Status: {consoleOutput.status}</span>
                        {consoleOutput.time && <span><Clock className="h-3 w-3 inline mr-1" />{consoleOutput.time}s</span>}
                        {consoleOutput.memory > 0 && <span>{(consoleOutput.memory / 1024).toFixed(1)} MB</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Run your code to see output here.
                    </p>
                  )}
                </TabsContent>

                {!isProblemMode && (
                  <TabsContent value="input" className="flex-1 overflow-y-auto p-4 m-0">
                    <textarea
                      className="w-full h-full min-h-[100px] bg-transparent text-foreground font-mono text-sm resize-none outline-none placeholder:text-muted-foreground"
                      placeholder="Type stdin input here (e.g. values for input() in Python)..."
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                    />
                  </TabsContent>
                )}

                {isProblemMode && (
                  <TabsContent value="result" className="flex-1 overflow-y-auto p-4 m-0">
                    {isRunning ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Running tests...
                      </div>
                    ) : runResults ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {runResults.every((t) => t.passed) ? (
                            <Badge className="rounded-full bg-green-500/15 text-green-400 border-green-500/30">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Passed
                            </Badge>
                          ) : (
                            <Badge className="rounded-full bg-red-500/15 text-red-400 border-red-500/30">
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Some Failed
                            </Badge>
                          )}
                        </div>
                        {runResults.map((t, i) => (
                          <div
                            key={i}
                            className={`rounded-xl border p-3 font-mono text-xs space-y-1 ${
                              t.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                            }`}
                          >
                            <div className="font-semibold text-foreground">Case {i + 1}</div>
                            <div><span className="text-muted-foreground">Input: </span>{t.input}</div>
                            <div><span className="text-muted-foreground">Expected: </span>{t.expected_output}</div>
                            <div>
                              <span className="text-muted-foreground">Output: </span>
                              <span className={t.passed ? "text-green-400" : "text-red-400"}>{t.actual_output}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Run or submit your code to see results.
                      </p>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
