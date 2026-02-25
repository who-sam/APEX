import { useState, useEffect } from "react";
import { getStudentClasses, type ClassData } from "../../api";
import { Users } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Classes you've joined.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-12 text-center">
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No classes yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your teacher for an invite code to join a class.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5"
            >
              <h3 className="text-base font-semibold text-foreground">
                {cls.name}
              </h3>
              {cls.section && (
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {cls.section}
                </span>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                <Users size={14} />
                <span>{cls.member_count} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
