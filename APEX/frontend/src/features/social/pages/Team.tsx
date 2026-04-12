import { useNavigate } from "react-router-dom";
import { Users, Mail, Trophy, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const teamMembers = [
  { id: 1, name: "John Doe", email: "john@apex.dev", role: "Team Lead", initials: "JD", score: 88, exams: 12, streak: 5, status: "online" },
  { id: 2, name: "Sarah Chen", email: "sarah@apex.dev", role: "Developer", initials: "SC", score: 92, exams: 15, streak: 8, status: "online" },
  { id: 3, name: "Alex Rivera", email: "alex@apex.dev", role: "Developer", initials: "AR", score: 76, exams: 9, streak: 3, status: "away" },
  { id: 4, name: "Maya Patel", email: "maya@apex.dev", role: "Designer", initials: "MP", score: 84, exams: 7, streak: 4, status: "offline" },
  { id: 5, name: "James Wilson", email: "james@apex.dev", role: "Developer", initials: "JW", score: 71, exams: 6, streak: 2, status: "online" },
  { id: 6, name: "Emily Zhao", email: "emily@apex.dev", role: "QA Engineer", initials: "EZ", score: 95, exams: 18, streak: 12, status: "online" },
];

const statusColor = (s: string) => {
  if (s === "online") return "bg-green-500";
  if (s === "away") return "bg-accent";
  return "bg-muted-foreground";
};

export default function TeamPage() {
  const navigate = useNavigate();
  const teamAvg = Math.round(teamMembers.reduce((a, m) => a + m.score, 0) / teamMembers.length);
  const topPerformer = teamMembers.reduce((a, b) => (a.score > b.score ? a : b));

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
              <p className="text-2xl font-bold text-foreground">{topPerformer.name}</p>
              <p className="text-sm text-muted-foreground">Top Performer ({topPerformer.score}%)</p>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.map((member) => (
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
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg Score</span>
                    <span className="font-medium text-foreground">{member.score}%</span>
                  </div>
                  <Progress value={member.score} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{member.exams} exams taken</span>
                  <Badge variant="secondary" className="text-xs">🔥 {member.streak} streak</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
