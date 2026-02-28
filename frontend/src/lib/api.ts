const API_BASE = "http://localhost:8080/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "teacher" | "student";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function signup(
  email: string,
  password: string,
  name: string,
  role: "teacher" | "student"
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// Code execution

export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: string;
  status_id: number;
  time: string;
  memory: number;
}

export async function executeCode(
  language: string,
  code: string,
  stdin?: string
): Promise<ExecuteResponse> {
  return apiFetch("/execute", {
    method: "POST",
    body: JSON.stringify({ language, code, stdin: stdin || "" }),
  });
}

// Classes

export interface ClassData {
  id: number;
  teacher_id: number;
  name: string;
  section: string;
  invite_code: string;
  created_at: string;
  member_count: number;
}

export async function createClass(name: string, section: string): Promise<ClassData> {
  return apiFetch("/classes", {
    method: "POST",
    body: JSON.stringify({ name, section }),
  });
}

export async function getClasses(): Promise<ClassData[]> {
  return apiFetch("/classes");
}

export interface ClassDetail {
  class: ClassData;
  members: Array<{
    id: number;
    class_id: number;
    user_id: number;
    joined_at: string;
    user: AuthUser;
  }>;
}

export async function getClass(id: number): Promise<ClassDetail> {
  return apiFetch(`/classes/${id}`);
}

export async function deleteClass(id: number): Promise<void> {
  return apiFetch(`/classes/${id}`, { method: "DELETE" });
}

export async function joinClass(inviteCode: string): Promise<{ message: string; class: ClassData }> {
  return apiFetch("/student/classes/join", {
    method: "POST",
    body: JSON.stringify({ invite_code: inviteCode }),
  });
}

export async function getStudentClasses(): Promise<ClassData[]> {
  return apiFetch("/student/classes");
}

// Exams

export interface ExamData {
  id: number;
  teacher_id: number;
  title: string;
  description: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  problem_count: number;
  class_count: number;
  problems?: ProblemData[];
  exam_classes?: Array<{ id: number; exam_id: number; class_id: number; class?: ClassData }>;
}

export interface ExamWithStatus extends ExamData {
  status: "upcoming" | "active" | "completed";
}

export async function createExam(data: {
  title: string;
  description?: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
}): Promise<ExamData> {
  return apiFetch("/exams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getExams(): Promise<ExamData[]> {
  return apiFetch("/exams");
}

export async function getExam(id: number): Promise<ExamData> {
  return apiFetch(`/exams/${id}`);
}

export async function updateExam(
  id: number,
  data: {
    title: string;
    description?: string;
    duration_minutes?: number;
    start_time?: string;
    end_time?: string;
  }
): Promise<ExamData> {
  return apiFetch(`/exams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExam(id: number): Promise<void> {
  return apiFetch(`/exams/${id}`, { method: "DELETE" });
}

export async function assignExam(examId: number, classIds: number[]): Promise<void> {
  return apiFetch(`/exams/${examId}/assign`, {
    method: "POST",
    body: JSON.stringify({ class_ids: classIds }),
  });
}

// Problems

export interface ProblemData {
  id: number;
  exam_id: number;
  title: string;
  description: string;
  difficulty: string;
  starter_code: string;
  hints: string;
  time_limit_ms: number;
  memory_limit_kb: number;
  order_index: number;
  test_cases?: TestCaseData[];
}

export async function getProblem(id: number): Promise<ProblemData> {
  return apiFetch(`/problems/${id}`);
}

export async function addProblem(
  examId: number,
  data: {
    title: string;
    description: string;
    difficulty?: string;
    starter_code?: string;
    hints?: string;
    time_limit_ms?: number;
    memory_limit_kb?: number;
    order_index?: number;
  }
): Promise<ProblemData> {
  return apiFetch(`/exams/${examId}/problems`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProblem(
  id: number,
  data: Partial<ProblemData>
): Promise<ProblemData> {
  return apiFetch(`/problems/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProblem(id: number): Promise<void> {
  return apiFetch(`/problems/${id}`, { method: "DELETE" });
}

// Test Cases

export interface TestCaseData {
  id: number;
  problem_id: number;
  input: string;
  expected_output: string;
  is_sample: boolean;
  order_index: number;
}

export async function addTestCase(
  problemId: number,
  data: {
    input: string;
    expected_output: string;
    is_sample?: boolean;
    order_index?: number;
  }
): Promise<TestCaseData> {
  return apiFetch(`/problems/${problemId}/test-cases`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTestCase(
  id: number,
  data: Partial<TestCaseData>
): Promise<TestCaseData> {
  return apiFetch(`/test-cases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTestCase(id: number): Promise<void> {
  return apiFetch(`/test-cases/${id}`, { method: "DELETE" });
}

// Submissions

export interface SubmissionData {
  id: number;
  user_id: number;
  problem_id: number;
  exam_id: number;
  language: string;
  code: string;
  status: string;
  passed_count: number;
  total_count: number;
  score: number;
  execution_time_ms: number;
  memory_kb: number;
  submitted_at: string;
  problem?: ProblemData;
  user?: AuthUser;
}

export interface TestResultData {
  id: number;
  submission_id: number;
  test_case_id: number;
  passed: boolean;
  actual_output: string;
  execution_time_ms: number;
  memory_kb: number;
  status: string;
  is_sample: boolean;
  input?: string;
  expected_output?: string;
}

export async function submitSolution(data: {
  problem_id: number;
  exam_id: number;
  language: string;
  code: string;
}): Promise<SubmissionData> {
  return apiFetch("/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface RunResult {
  test_case_id: number;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  status: string;
}

export async function runSolution(data: {
  problem_id: number;
  language: string;
  code: string;
}): Promise<{ results: RunResult[] }> {
  return apiFetch("/submissions/run", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSubmission(id: number): Promise<{
  submission: SubmissionData;
  test_results: TestResultData[];
}> {
  return apiFetch(`/submissions/${id}`);
}

// Student

export async function getStudentExams(): Promise<ExamWithStatus[]> {
  return apiFetch("/student/exams");
}

export async function getStudentExam(id: number): Promise<{
  exam: ExamData;
  submissions: SubmissionData[];
}> {
  return apiFetch(`/student/exams/${id}`);
}

export async function getStudentSubmissions(): Promise<SubmissionData[]> {
  return apiFetch("/student/submissions");
}

// Analytics (Teacher)

export interface StudentResult {
  user_id: number;
  name: string;
  email: string;
  submissions: SubmissionData[];
  total_score: number;
  avg_score: number;
}

export async function getExamResults(examId: number): Promise<StudentResult[]> {
  return apiFetch(`/exams/${examId}/results`);
}

export interface ClassStats {
  class: ClassData;
  member_count: number;
  exam_count: number;
  total_submissions: number;
  avg_score: number;
  pass_rate: number;
}

export async function getClassStats(classId: number): Promise<ClassStats> {
  return apiFetch(`/classes/${classId}/stats`);
}

export function getExamResultsExportUrl(examId: number): string {
  return `${API_BASE}/exams/${examId}/results/export`;
}

// Profile

export interface UserProfile {
  id: number;
  user_id: number;
  bio: string;
  notify_email: boolean;
  notify_push: boolean;
  notify_exam_reminders: boolean;
  notify_results: boolean;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch("/profile");
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch("/profile/password", {
    method: "PUT",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

// Messages

export interface MessageData {
  id: number;
  from_id: number;
  to_id: number;
  subject: string;
  body: string;
  type: string;
  read: boolean;
  starred: boolean;
  created_at: string;
  from_user?: AuthUser;
}

export async function getMessages(): Promise<MessageData[]> {
  return apiFetch("/messages");
}

export async function getMessage(id: number): Promise<MessageData> {
  return apiFetch(`/messages/${id}`);
}

export async function sendMessage(data: {
  to_id: number;
  subject: string;
  body: string;
  type?: string;
}): Promise<MessageData> {
  return apiFetch("/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markMessageRead(id: number): Promise<void> {
  return apiFetch(`/messages/${id}/read`, { method: "PUT" });
}

export async function toggleMessageStar(id: number): Promise<void> {
  return apiFetch(`/messages/${id}/star`, { method: "PUT" });
}

export async function deleteMessage(id: number): Promise<void> {
  return apiFetch(`/messages/${id}`, { method: "DELETE" });
}

// Teams

export interface TeamData {
  id: number;
  name: string;
  created_at: string;
  members?: TeamMemberData[];
}

export interface TeamMemberData {
  id: number;
  team_id: number;
  user_id: number;
  role: string;
  user?: AuthUser;
}

export async function getTeams(): Promise<TeamData[]> {
  return apiFetch("/teams");
}

export async function getTeam(id: number): Promise<TeamData> {
  return apiFetch(`/teams/${id}`);
}

export async function createTeam(name: string): Promise<TeamData> {
  return apiFetch("/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function addTeamMember(teamId: number, userId: number, role?: string): Promise<void> {
  return apiFetch(`/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role: role || "member" }),
  });
}

// Student Stats

export interface StudentStats {
  exams_taken: number;
  avg_score: number;
  pass_rate: number;
  total_submissions: number;
}

export async function getStudentStats(): Promise<StudentStats> {
  return apiFetch("/student/stats");
}

export interface PerformancePoint {
  month: string;
  score: number;
}

export async function getStudentPerformance(): Promise<PerformancePoint[]> {
  return apiFetch("/student/performance");
}
