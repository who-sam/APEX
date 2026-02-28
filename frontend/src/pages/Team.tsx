import { useState, useEffect } from "react";
import { Users, Mail, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getTeams, createTeam } from "@/lib/api";
import type { TeamData } from "@/lib/api";

export default function TeamPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const team = await createTeam(newTeamName.trim());
      setTeams((prev) => [...prev, team]);
      setNewTeamName("");
      setDialogOpen(false);
    } catch {}
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1>
          <p className="mt-1 text-muted-foreground">Collaborate and track your team's progress.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Study Group Alpha"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !newTeamName.trim()} className="w-full">
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teams.length}</p>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 p-3"><Users className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {teams.reduce((a, t) => a + (t.members?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams */}
      {teams.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You're not part of any team yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        teams.map((team) => (
          <Card key={team.id} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {team.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(team.members || []).map((member) => (
                  <div key={member.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3 hover:bg-secondary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-sm text-primary">
                          {(member.user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.user?.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{member.user?.email}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
