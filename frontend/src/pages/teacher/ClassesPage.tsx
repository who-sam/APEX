import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClasses, createClass, deleteClass, type ClassData } from "../../api";
import { Users, Plus, Copy, Trash2 } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const data = await getClasses();
      setClasses(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createClass(name, section);
    setName("");
    setSection("");
    setShowCreate(false);
    loadClasses();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this class?")) return;
    await deleteClass(id);
    loadClasses();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your classes and invite students.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Create Class
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-foreground">
            New Class
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Class Name (e.g., Data Structures)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input
              type="text"
              placeholder="Section (e.g., CS201-A)"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-12 text-center">
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No classes yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first class to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/teacher/classes/${cls.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {cls.name}
                  </h3>
                  {cls.section && (
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {cls.section}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(cls.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users size={14} />
                  <span>{cls.member_count} students</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyCode(cls.invite_code);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-mono text-foreground hover:bg-secondary/80"
                  title="Copy invite code"
                >
                  <Copy size={12} />
                  {cls.invite_code}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
