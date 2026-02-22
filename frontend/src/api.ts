const API_URL = "http://localhost:8080/api/execute";

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: string;     // e.g. "Accepted", "Compilation Error", "Runtime Error"
  status_id: number;  // 3 = Accepted, 6 = Compilation Error, etc.
  time: string;       // execution time in seconds
  memory: number;     // memory used in KB
}

export async function executeCode(
  language: string,
  code: string
): Promise<ExecuteResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}
