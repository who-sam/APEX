import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  BookOpen,
  Calendar,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { joinClass, getStudentClasses, type ClassData } from "@/lib/api";

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  // Join dialog
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await getStudentClasses();
      setClasses(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinClass() {
    const code = inviteCode.trim();
    if (!code) {
      setJoinError("Please enter an invite code");
      return;
    }
    try {
      setJoining(true);
      setJoinError(null);
      setJoinSuccess(null);
      const result = await joinClass(code);
      setJoinSuccess(`Joined "${result.class.name}" successfully!`);
      setInviteCode("");
      // Reload classes
      await loadClasses();
      // Auto-close after a moment
      setTimeout(() => {
        setJoinDialogOpen(false);
        setJoinSuccess(null);
      }, 1500);
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : "Failed to join class"
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Classes
          </h1>
          <p className="mt-1 text-muted-foreground">
            View your enrolled classes or join a new one with an invite code.
          </p>
        </div>

        <Dialog
          open={joinDialogOpen}
          onOpenChange={(open) => {
            setJoinDialogOpen(open);
            if (!open) {
              setInviteCode("");
              setJoinError(null);
              setJoinSuccess(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 text-base font-semibold shadow-lg shadow-primary/25">
              <Plus className="h-5 w-5" />
              Join Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Enter the invite code provided by your teacher to join their class.
              </p>
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  placeholder="e.g. ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="text-center text-lg font-mono tracking-widest"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoinClass();
                  }}
                />
              </div>
              {joinError && (
                <p className="text-sm text-destructive">{joinError}</p>
              )}
              {joinSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  {joinSuccess}
                </div>
              )}
              <Button
                onClick={handleJoinClass}
                disabled={joining || !!joinSuccess}
                className="w-full gap-2"
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : joinSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {joinSuccess ? "Joined!" : "Join Class"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-foreground">
                No classes yet
              </p>
              <p className="text-sm text-muted-foreground">
                Ask your teacher for an invite code and click "Join Class" to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassData }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(cls.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-md group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {cls.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{cls.section}</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Users className="h-3 w-3 mr-1" />
            {cls.member_count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Joined {new Date(cls.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Invite code (so student can share with classmates) */}
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Invite Code</p>
            <p className="font-mono text-sm font-medium text-foreground tracking-wider">
              {cls.invite_code}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={copyCode}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
