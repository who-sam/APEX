const API_BASE = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("kernel-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("kernel-token");
    localStorage.removeItem("kernel-role");
    window.location.href = "/auth";
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export function signup(email: string, password: string, name: string, role: string) {
  return apiFetch<{ token: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name, role }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ── Classes ───────────────────────────────────────────
export function createClass(data: { name: string; section?: string }) {
  return apiFetch<any>("/classes", { method: "POST", body: JSON.stringify(data) });
}

export function getClasses() {
  return apiFetch<any[]>("/classes");
}

export function getClass(id: number) {
  return apiFetch<any>(`/classes/${id}`);
}

export function deleteClass(id: number) {
  return apiFetch<any>(`/classes/${id}`, { method: "DELETE" });
}

export function joinClass(inviteCode: string) {
  return apiFetch<any>("/student/classes/join", { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) });
}

export function getStudentClasses() {
  return apiFetch<any[]>("/student/classes");
}

// ── Exams ─────────────────────────────────────────────
export function createExam(data: {
  title: string;
  description?: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
  shuffle_questions?: boolean;
  show_results_after?: boolean;
  passing_score?: number;
  is_practice?: boolean;
}) {
  return apiFetch<any>("/exams", { method: "POST", body: JSON.stringify(data) });
}

export function getExams() {
  return apiFetch<any[]>("/exams");
}

export function getExam(id: number) {
  return apiFetch<any>(`/exams/${id}`);
}

export function updateExam(id: number, data: any) {
  return apiFetch<any>(`/exams/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteExam(id: number) {
  return apiFetch<any>(`/exams/${id}`, { method: "DELETE" });
}

export function assignExam(id: number, classIds: number[]) {
  return apiFetch<any>(`/exams/${id}/assign`, { method: "POST", body: JSON.stringify({ class_ids: classIds }) });
}

// ── Problems ──────────────────────────────────────────
export function addProblem(examId: number, data: any) {
  return apiFetch<any>(`/exams/${examId}/problems`, { method: "POST", body: JSON.stringify(data) });
}

export function getProblem(id: number) {
  return apiFetch<any>(`/problems/${id}`);
}

export function updateProblem(id: number, data: any) {
  return apiFetch<any>(`/problems/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteProblem(id: number) {
  return apiFetch<any>(`/problems/${id}`, { method: "DELETE" });
}

// ── Test Cases ────────────────────────────────────────
export function addTestCase(problemId: number, data: { input: string; expected_output: string; is_sample: boolean; order_index?: number }) {
  return apiFetch<any>(`/problems/${problemId}/test-cases`, { method: "POST", body: JSON.stringify(data) });
}

export function updateTestCase(id: number, data: any) {
  return apiFetch<any>(`/test-cases/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteTestCase(id: number) {
  return apiFetch<any>(`/test-cases/${id}`, { method: "DELETE" });
}

// ── Submissions ───────────────────────────────────────
export function submitSolution(data: {
  problem_id: number;
  exam_id: number;
  type?: string;
  language?: string;
  code?: string;
  selected_options?: string;
  text_answer?: string;
}) {
  return apiFetch<any>("/submissions", { method: "POST", body: JSON.stringify(data) });
}

export function runSolution(data: { problem_id: number; language: string; code: string }) {
  return apiFetch<any>("/submissions/run", { method: "POST", body: JSON.stringify(data) });
}

export function getSubmission(id: number) {
  return apiFetch<any>(`/submissions/${id}`);
}

// ── Student ───────────────────────────────────────────
export function getStudentExams() {
  return apiFetch<any[]>("/student/exams");
}

export function getStudentExam(id: number) {
  return apiFetch<any>(`/student/exams/${id}`);
}

export function getStudentSubmissions() {
  return apiFetch<any[]>("/student/submissions");
}

export function getStudentStats() {
  return apiFetch<any>("/student/stats");
}

export function getStudentPerformance() {
  return apiFetch<any>("/student/performance");
}

export function getStudentPractice() {
  return apiFetch<any[]>("/student/practice");
}

// ── Profile ───────────────────────────────────────────
export function getProfile() {
  return apiFetch<any>("/profile");
}

export function updateProfile(data: { name?: string; bio?: string; avatar_url?: string }) {
  return apiFetch<any>("/profile", { method: "PUT", body: JSON.stringify(data) });
}

export function changePassword(data: { current_password: string; new_password: string }) {
  return apiFetch<any>("/profile/password", { method: "PUT", body: JSON.stringify(data) });
}

// ── Messages ──────────────────────────────────────────
export function getMessages() {
  return apiFetch<any[]>("/messages");
}

export function getMessage(id: number) {
  return apiFetch<any>(`/messages/${id}`);
}

export function sendMessage(data: { recipient_id: number; subject: string; body: string }) {
  return apiFetch<any>("/messages", { method: "POST", body: JSON.stringify(data) });
}

export function markMessageRead(id: number) {
  return apiFetch<any>(`/messages/${id}/read`, { method: "PUT" });
}

export function toggleMessageStar(id: number) {
  return apiFetch<any>(`/messages/${id}/star`, { method: "PUT" });
}

export function deleteMessage(id: number) {
  return apiFetch<any>(`/messages/${id}`, { method: "DELETE" });
}

// ── Teams ─────────────────────────────────────────────
export function getTeams() {
  return apiFetch<any[]>("/teams");
}

export function getTeam(id: number) {
  return apiFetch<any>(`/teams/${id}`);
}

export function createTeam(data: { name: string; class_id: number }) {
  return apiFetch<any>("/teams", { method: "POST", body: JSON.stringify(data) });
}

export function addTeamMember(teamId: number, userId: number) {
  return apiFetch<any>(`/teams/${teamId}/members`, { method: "POST", body: JSON.stringify({ user_id: userId }) });
}

// ── Notifications ─────────────────────────────────────
export function getNotifications() {
  return apiFetch<any[]>("/notifications");
}

export function markNotificationRead(id: number) {
  return apiFetch<any>(`/notifications/${id}/read`, { method: "PUT" });
}

export function markAllNotificationsRead() {
  return apiFetch<any>("/notifications/read-all", { method: "PUT" });
}

export function getUnreadNotificationCount() {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

// ── Leaderboard ───────────────────────────────────────
export function getClassLeaderboard(classId: number, period = "all") {
  return apiFetch<any[]>(`/leaderboard?class_id=${classId}&period=${period}`);
}

export function getGlobalLeaderboard(period = "all") {
  return apiFetch<any[]>(`/leaderboard/global?period=${period}`);
}

// ── Teacher ───────────────────────────────────────────
export function getTeacherDashboard() {
  return apiFetch<any>("/teacher/dashboard");
}

// ── Execute ───────────────────────────────────────────
export function executeCode(data: { language: string; code: string; stdin?: string }) {
  return apiFetch<any>("/execute", { method: "POST", body: JSON.stringify(data) });
}

// ── Exam Results (teacher) ────────────────────────────
export function getExamResults(examId: number) {
  return apiFetch<any>(`/exams/${examId}/results`);
}
