import { useNavigate } from "react-router-dom";
import { Users, Mail, Trophy, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTeams } from "@/hooks/useTeams";
import { PageSkeleton } from "@/components/PageSkeleton";

const statusColor = (s: string) => {
  if (s === "online") return "bg-green-500";
  if (s === "away") return "bg-accent";
  return "bg-muted-foreground";
};

export default function TeamPage() {
  const navigate = useNavigate();
  const { data: teams, isLoading } = useTeams();

  const team = (teams || [])[0];
  const teamMembers = (team?.members || []).map((m: any) => {
    const name = m.user?.name || "Unknown";
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    return {
      id: m.user_id || m.id,
      name,
      email: m.user?.email || "",
      role: m.role || "member",
      initials,
      score: 0,
      exams: 0,
      streak: 0,
      status: "offline",
    };
  });

  const teamAvg = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((a: number, m: any) => a + m.score, 0) / teamMembers.length)
    : 0;
  const topPerformer = teamMembers.length > 0
    ? teamMembers.reduce((a: any, b: any) => (a.score > b.score ? a : b))
    : null;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Team</h1>
        <p className="mt-1 text-muted-foreground">
          {team ? team.name : "Collaborate and track your team's progress."}
        </p>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
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
              <p className="text-2xl font-bold text-foreground">{topPerformer?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {topPerformer ? `Top Performer (${topPerformer.score}%)` : "No data yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member cards */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No team members yet. Create or join a team to get started.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member: any) => (
                <div key={member.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-sm text-primary">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColor(member.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg Score</span>
                      <span className="font-medium text-foreground">{member.score}%</span>
                    </div>
                    <Progress value={member.score} className="h-1.5" />
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
