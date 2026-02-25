import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClass, getClassStats, type ClassDetail, type ClassStats } from "../../api";
import { ArrowLeft, Copy, Users } from "lucide-react";

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const classId = Number(id);
    Promise.all([getClass(classId), getClassStats(classId)])
      .then(([d, s]) => {
        setDetail(d);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  const cls = detail.class;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/teacher/classes")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cls.name}</h1>
          {cls.section && (
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              {cls.section}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <p className="text-sm text-muted-foreground">Students</p>
          <p className="text-2xl font-bold text-foreground">{stats?.member_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <p className="text-sm text-muted-foreground">Exams</p>
          <p className="text-2xl font-bold text-foreground">{stats?.exam_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <p className="text-sm text-muted-foreground">Avg Score</p>
          <p className="text-2xl font-bold text-foreground">{(stats?.avg_score ?? 0).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <p className="text-sm text-muted-foreground">Pass Rate</p>
          <p className="text-2xl font-bold text-foreground">{(stats?.pass_rate ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Invite Code */}
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Invite Code
        </h3>
        <div className="flex items-center gap-3">
          <code className="rounded-lg bg-secondary px-4 py-2 text-lg font-mono font-bold text-primary tracking-wider">
            {cls.invite_code}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(cls.invite_code)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Share this code with students so they can join your class.
        </p>
      </div>

      {/* Members */}
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Members ({detail.members.length})
        </h3>
        {detail.members.length === 0 ? (
          <div className="text-center py-8">
            <Users size={36} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No students have joined yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {m.user.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm text-foreground">
                          {m.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {m.user.email}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
