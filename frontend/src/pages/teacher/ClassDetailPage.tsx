import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Loader2,
  AlertCircle,
  GraduationCap,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClass, deleteClass, type ClassDetail } from "@/lib/api";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getClass(Number(id));
        setClassDetail(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load class details"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    try {
      setDeleting(true);
      await deleteClass(Number(id));
      navigate("/teacher/classes");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete class"
      );
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  function handleCopyInviteCode() {
    if (!classDetail) return;
    navigator.clipboard.writeText(classDetail.class.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <Button variant="outline" onClick={() => navigate("/teacher/classes")}>
          Back to Classes
        </Button>
      </div>
    );
  }

  if (!classDetail) return null;

  const cls = classDetail.class;
  const members = classDetail.members;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={() => navigate("/teacher/classes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {cls.name}
            </h1>
            {cls.section && (
              <p className="mt-1 text-muted-foreground">{cls.section}</p>
            )}
          </div>
        </div>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete Class
        </Button>
      </div>

      {/* Class Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-3xl font-bold text-foreground">
                  {members.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invite Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="rounded bg-secondary px-2 py-1 text-lg font-mono font-bold text-foreground">
                    {cls.invite_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleCopyInviteCode}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {new Date(cls.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Members
          </CardTitle>
          <CardDescription>
            Students enrolled in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No students have joined yet. Share the invite code to get
                started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.user?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          member.user?.role === "teacher"
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-primary/15 text-primary border-primary/30"
                        }
                      >
                        <GraduationCap className="mr-1 h-3 w-3" />
                        {member.user?.role ?? "student"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{cls.name}</span>?
              This action cannot be undone. All members will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
