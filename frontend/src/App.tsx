import { useState } from "react";
import Editor from "@monaco-editor/react";
import { executeCode, type ExecuteResponse } from "./api";

// Frontend language keys → Monaco language IDs.
// The backend maps these to Judge0 language IDs.
const LANGUAGES: { label: string; value: string; monacoId: string }[] = [
  { label: "Python 3", value: "python3", monacoId: "python" },
  { label: "JavaScript", value: "javascript", monacoId: "javascript" },
  { label: "C", value: "c", monacoId: "c" },
  { label: "C++", value: "cpp", monacoId: "cpp" },
];

const DEFAULT_CODE: Record<string, string> = {
  python3: 'print("Hello, world!")\n',
  javascript: 'console.log("Hello, world!");\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n',
};

function formatOutput(res: ExecuteResponse): string {
  const parts: string[] = [];

  // Show compile errors first (C/C++).
  if (res.compile_output) parts.push("[compile]\n" + res.compile_output);
  if (res.stdout) parts.push(res.stdout);
  if (res.stderr) parts.push("[stderr]\n" + res.stderr);

  // If status is not "Accepted" (id 3), show it.
  if (res.status_id !== 3) {
    parts.push("[status] " + res.status);
  }

  if (parts.length === 0) return "(no output)";
  return parts.join("\n");
}

export default function App() {
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [code, setCode] = useState(DEFAULT_CODE[LANGUAGES[0].value]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoId ?? "plaintext";

  function handleLanguageChange(lang: string) {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setOutput("");
  }

  async function handleRun() {
    setLoading(true);
    setOutput("");
    try {
      const res = await executeCode(language, code);
      setOutput(formatOutput(res));
    } catch (err: unknown) {
      setOutput("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200">
      {/* Toolbar */}
      <header className="flex items-center gap-4 px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <h1 className="text-lg font-semibold mr-auto">CodeJudge</h1>

        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-[#3c3c3c] text-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded px-4 py-1.5 text-sm transition-colors"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </header>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          theme="vs-dark"
          language={monacoLang}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Output console */}
      <div className="h-48 bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col">
        <div className="px-4 py-1 text-xs text-gray-400 bg-[#252526] border-b border-[#3c3c3c]">
          Output
        </div>
        <pre className="flex-1 overflow-auto p-4 text-sm font-mono whitespace-pre-wrap">
          {loading ? "Executing..." : output}
        </pre>
      </div>
    </div>
  );
}
