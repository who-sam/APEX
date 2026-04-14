import { useNavigate } from "react-router-dom";
import { Users, Mail, Trophy, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTeams } from "@/hooks/useTeams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

const statusColor = (s: string) => {
  if (s === "online") return "bg-green-500";
  if (s === "away") return "bg-accent";
  return "bg-muted-foreground";
};

export default function TeamPage() {
  const navigate = useNavigate();
  const { data: teams, isLoading, error, refetch } = useTeams();

  if (isLoading) return <PageSkeleton cards={3} rows={4} />;
  if (error) return <ErrorState message="Failed to load teams" onRetry={refetch} />;

  const allTeams = teams || [];

  // Flatten all members across teams for stats
  const allMembers = allTeams.flatMap((t: any) =>
    (t.members || []).map((m: any) => ({
      ...m,
      name: m.name || m.user?.name || "Unknown",
      role: m.role || "",
      score: m.score ?? m.avg_score ?? 0,
      exams: m.exams ?? m.exams_taken ?? 0,
      streak: m.streak ?? 0,
      status: m.status || "offline",
      email: m.email || m.user?.email || "",
      teamName: t.name,
    }))
  );

  if (allMembers.length === 0 && allTeams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team</h1>
          <p className="mt-1 text-muted-foreground">Collaborate and track your team's progress.</p>
        </div>
        <EmptyState icon={Users} title="No teams yet" description="You haven't joined any teams." />
      </div>
    );
  }

  const teamAvg = allMembers.length > 0
    ? Math.round(allMembers.reduce((a: number, m: any) => a + m.score, 0) / allMembers.length)
    : 0;
  const topPerformer = allMembers.length > 0
    ? allMembers.reduce((a: any, b: any) => (a.score > b.score ? a : b))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team</h1>
        <p className="mt-1 text-muted-foreground">Collaborate and track your team's progress.</p>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allMembers.length}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 p-3"><BookOpen className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teamAvg}%</p>
              <p className="text-sm text-muted-foreground">Team Avg Score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-green-500/10 p-3"><Trophy className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{topPerformer ? topPerformer.name : "N/A"}</p>
              <p className="text-sm text-muted-foreground">Top Performer{topPerformer ? ` (${topPerformer.score}%)` : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member cards per team */}
      {allTeams.map((team: any) => (
        <Card key={team.id} className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              {team.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(team.members || []).map((member: any) => {
                const memberName = member.name || member.user?.name || "Unknown";
                const memberRole = member.role || member.email || member.user?.email || "";
                const memberScore = member.score ?? member.avg_score ?? 0;
                const memberExams = member.exams ?? member.exams_taken ?? 0;
                const memberStreak = member.streak ?? 0;
                const memberStatus = member.status || "offline";

                return (
                  <div key={member.id || member.user_id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-sm text-primary">{getInitials(memberName)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColor(memberStatus)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{memberName}</p>
                        <p className="text-xs text-muted-foreground">{memberRole}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Avg Score</span>
                        <span className="font-medium text-foreground">{memberScore}%</span>
                      </div>
                      <Progress value={memberScore} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{memberExams} exams taken</span>
                      <Badge variant="secondary" className="text-xs">{memberStreak} streak</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate("/dashboard/messages")}
                    >
                      <Mail className="h-3 w-3" /> Message
                    </Button>
                  </div>
                );
              })}
              {(!team.members || team.members.length === 0) && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-4">No members in this team.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
