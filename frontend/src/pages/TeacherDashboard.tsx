import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <header className="flex items-center justify-between px-6 py-4 bg-[#252536] border-b border-[#3c3c4e]">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-green-400">&lt;/&gt;</span> CodeJudge
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/editor")}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Playground
          </button>
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-gray-400">
          Classes, exams, and grading tools coming soon.
        </p>
      </main>
    </div>
  );
}
