import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Users,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getClasses, createClass, type ClassData } from "@/lib/api";

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function loadClasses() {
    try {
      setLoading(true);
      setError(null);
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError("Class name is required");
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      const created = await createClass(newName.trim(), newSection.trim());
      setClasses((prev) => [...prev, created]);
      setDialogOpen(false);
      setNewName("");
      setNewSection("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create class"
      );
    } finally {
      setCreating(false);
    }
  }

  function handleCopyInviteCode(classId: number, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(classId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={loadClasses}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Classes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your classes and invite students.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  placeholder="e.g. Introduction to Computer Science"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-section">Section</Label>
                <Input
                  id="class-section"
                  placeholder="e.g. Section A, Fall 2026"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Class
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-foreground">No classes yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first class to get started.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="border-border/50 cursor-pointer transition-all hover:bg-secondary/40"
              onClick={() => navigate(`/teacher/classes/${cls.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    {cls.section && (
                      <CardDescription>{cls.section}</CardDescription>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    <Users className="mr-1 h-3 w-3" />
                    {cls.member_count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Invite Code:
                    </span>
                    <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
                      {cls.invite_code}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyInviteCode(cls.id, cls.invite_code);
                    }}
                  >
                    {copiedId === cls.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(cls.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
