export const githubUrl = (import.meta.env.VITE_GITHUB_URL as string | undefined)?.trim() || "";
export const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || "";

export const navAnchors = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "FAQ", href: "#faq" },
];

export const heroTests = [
  { n: 1, ok: true, ms: "2ms", note: "" },
  { n: 2, ok: true, ms: "3ms", note: "" },
  { n: 3, ok: false, ms: "1ms", note: 'expected "3"  got "2"' },
  { n: 4, ok: true, ms: "1ms", note: "" },
  { n: 5, ok: true, ms: "2ms", note: "" },
];

export const heroCodeLines: { tone: "kw" | "fn" | "var" | "str" | "muted" | "txt"; text: string }[][] = [
  [
    { tone: "kw", text: "def " },
    { tone: "fn", text: "solve" },
    { tone: "txt", text: "(" },
    { tone: "var", text: "n" },
    { tone: "txt", text: "):" },
  ],
  [
    { tone: "muted", text: "    # collect divisors of n" },
  ],
  [
    { tone: "txt", text: "    " },
    { tone: "kw", text: "return " },
    { tone: "txt", text: "[" },
    { tone: "var", text: "i " },
    { tone: "kw", text: "for " },
    { tone: "var", text: "i " },
    { tone: "kw", text: "in " },
    { tone: "fn", text: "range" },
    { tone: "txt", text: "(1, " },
    { tone: "var", text: "n" },
    { tone: "txt", text: " + 1) " },
    { tone: "kw", text: "if " },
    { tone: "var", text: "n " },
    { tone: "txt", text: "% " },
    { tone: "var", text: "i " },
    { tone: "txt", text: "== 0]" },
  ],
];

export const howItWorks = [
  {
    step: "01",
    title: "Build the exam.",
    body: "Mix coding, MCQ, and written. Set points, time limits, hints. Pull from your question bank.",
  },
  {
    step: "02",
    title: "Assign to classes.",
    body: "Share the 8-character invite code. Students join and the exam appears on their schedule.",
  },
  {
    step: "03",
    title: "Grade and review.",
    body: "Code grades on submission. Written answers route to the manual queue. Results stream into the explorer.",
  },
];

export const features = [
  {
    title: "Build exams.",
    body: "Coding, MCQ, written. Per-question points, time limits, hints, tags. Reusable question bank.",
    example: "tags: [arrays, two-pointer]",
  },
  {
    title: "Auto-grade code.",
    body: "Judge0 sandbox runs each test case. Output normalized and diffed. Score = passed / total.",
    example: "python3 solution.py < tests/01.in",
  },
  {
    title: "Manual grading queue.",
    body: "Written answers route to teacher. Score override and feedback per submission.",
    example: "PUT /submissions/:id/grade",
  },
];

export const teacherBullets = [
  "Class invite codes",
  "Draft and publish exams",
  "Assign to multiple classes",
  "Results explorer",
  "Pending grading queue",
  "Announcements with attachments",
];

export const studentBullets = [
  "Join by 8-character code",
  "Timed attempts with autosave and resume",
  "Monaco editor",
  "Sample-test feedback",
  "Per-test result breakdown",
];

export const stack = ["Go", "Gin", "PostgreSQL", "React", "Vite", "Judge0", "JWT"];

export const faq = [
  {
    q: "Can I self-host the whole thing?",
    a: "Yes. The backend is a single Go binary, the frontend is a static Vite bundle, and the only required service is PostgreSQL 16. Judge0 can be self-hosted too — the public CE instance is fine for development.",
  },
  {
    q: "Where does student code execute?",
    a: "In a Judge0 sandbox you control. APEX never runs code on the API server. Each submission is sent to Judge0 with stdin, expected stdout is normalized, and results stream back per test case.",
  },
  {
    q: "How are written answers handled?",
    a: "Written submissions skip auto-grading and land in the teacher's pending queue. The teacher sets a score and writes feedback; the attempt total re-aggregates automatically.",
  },
  {
    q: "Which languages can students submit?",
    a: "Anything Judge0 supports — Python, C, C++, Java, JavaScript, Go, Rust, and more. Aliases live in internal/judge0/client.go and can be extended.",
  },
  {
    q: "Can I export grades?",
    a: "The results explorer shows per-attempt scores. CSV export is on the roadmap; for now scores are accessible via the REST API.",
  },
];
