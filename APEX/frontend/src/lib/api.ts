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
    // Only redirect if we had a token (session expired). No token = just throw.
    if (token) {
      localStorage.removeItem("kernel-token");
      localStorage.removeItem("kernel-role");
      window.location.href = "/auth";
    }
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

export function googleAuth(idToken: string, role?: string) {
  return apiFetch<{ token?: string; user?: any; needs_role?: boolean; email?: string; name?: string }>(
    "/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ id_token: idToken, role }),
    }
  );
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export function deleteAccount() {
  return apiFetch<{ message: string }>("/auth/account", { method: "DELETE" });
}

// ── Classes ───────────────────────────────────────────
export function createClass(data: { name: string; section?: string }) {
  return apiFetch<any>("/classes", { method: "POST", body: JSON.stringify(data) });
}

export function getClasses() {
  return apiFetch<any[]>("/classes");
}

export async function getClass(id: number) {
  const res = await apiFetch<any>(`/classes/${id}`);
  return { ...res.class, members: res.members, exams: res.exams };
}

export function getStudentClass(id: number) {
  return apiFetch<any>(`/student/classes/${id}`);
}

export function updateClass(id: number, data: { name?: string; section?: string; cover_image?: string; grades_announced?: boolean; passing_threshold?: number; block_announce_with_pending?: boolean }) {
  return apiFetch<any>(`/classes/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteClass(id: number) {
  return apiFetch<any>(`/classes/${id}`, { method: "DELETE" });
}

export function removeClassMember(classId: number, userId: number) {
  return apiFetch<any>(`/classes/${classId}/members/${userId}`, { method: "DELETE" });
}

// ── Exam Attempts ─────────────────────────────────────
export function startExamAttempt(examId: number) {
  return apiFetch<any>(`/student/exams/${examId}/start`, { method: "POST" });
}

export function submitExamAttempt(examId: number, answers: any[]) {
  return apiFetch<any>(`/student/exams/${examId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function getMyAttempts() {
  return apiFetch<any[]>("/attempts/mine");
}

export function joinClass(inviteCode: string) {
  return apiFetch<any>("/student/classes/join", { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) });
}

export function leaveClass(classId: number) {
  return apiFetch<any>(`/student/classes/${classId}`, { method: "DELETE" });
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
  is_draft?: boolean;
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

export function closeExam(id: number) {
  return apiFetch<any>(`/exams/${id}/close`, { method: "POST" });
}

export function reopenExam(id: number, minutes: number) {
  return apiFetch<any>(`/exams/${id}/reopen`, { method: "POST", body: JSON.stringify({ minutes }) });
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

export function saveProblemToBank(data: any) {
  return apiFetch<any>("/problems/bank", { method: "POST", body: JSON.stringify(data) });
}

// ── Test Cases ────────────────────────────────────────
export function addTestCase(problemId: number, data: { input: string; expected_output: string; is_sample: boolean; points?: number; order_index?: number }) {
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

export function updateProfile(data: { name?: string; bio?: string; avatar_url?: string; notify_email?: boolean; notify_push?: boolean; notify_exam_reminders?: boolean; notify_results?: boolean; notify_exam_email?: boolean; block_announce_with_pending?: boolean; default_exam_draft?: boolean; default_passing_threshold?: number }) {
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

export function sendMessage(data: { to_id: number; subject: string; body: string; type?: string }) {
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

// ── Problems ─────────────────────────────────────────
export function getAllProblems() {
  return apiFetch<any[]>("/problems");
}

// ── Class Stats ──────────────────────────────────────
export function getClassStats(id: number) {
  return apiFetch<any>(`/classes/${id}/stats`);
}

// ── Manual Grading ───────────────────────────────────
export function gradeSubmission(id: number, data: { score: number; status: string; teacher_feedback?: string }) {
  return apiFetch<any>(`/submissions/${id}/grade`, { method: "PUT", body: JSON.stringify(data) });
}

// ── Execute ───────────────────────────────────────────
export function executeCode(data: { language: string; code: string; stdin?: string }) {
  return apiFetch<any>("/execute", { method: "POST", body: JSON.stringify(data) });
}

// ── Exam Results (teacher) ────────────────────────────
export function getExamResults(examId: number) {
  return apiFetch<any>(`/exams/${examId}/results`);
}

// ── Announcements ─────────────────────────────────────
export function getAnnouncements(classId: number) {
  return apiFetch<any[]>(`/classes/${classId}/announcements`);
}

export function createAnnouncement(classId: number, data: { title: string; body?: string; attachments?: string }) {
  return apiFetch<any>(`/classes/${classId}/announcements`, { method: "POST", body: JSON.stringify(data) });
}

export function updateAnnouncement(id: number, data: { title?: string; body?: string; attachments?: string }) {
  return apiFetch<any>(`/announcements/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteAnnouncement(id: number) {
  return apiFetch<any>(`/announcements/${id}`, { method: "DELETE" });
}

// ── Folders ───────────────────────────────────────────
export function createFolder(data: { name: string }) {
  return apiFetch<any>("/folders", { method: "POST", body: JSON.stringify(data) });
}

export function getFolders() {
  return apiFetch<any[]>("/folders");
}

export function updateFolder(id: number, data: { name?: string }) {
  return apiFetch<any>(`/folders/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteFolder(id: number) {
  return apiFetch<any>(`/folders/${id}`, { method: "DELETE" });
}
