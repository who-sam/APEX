import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, Clock, CheckCircle, Megaphone, UserPlus, Send } from "lucide-react";
import { useNotifications } from "@/features/social/contexts/NotificationContext";

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  exam: { icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  result: { icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  class: { icon: UserPlus, color: "text-purple-500 bg-purple-500/10" },
  submission: { icon: Send, color: "text-green-600 bg-green-600/10" },
  system: { icon: Megaphone, color: "text-blue-500 bg-blue-500/10" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{unreadCount}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all as read</Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="exam">Exams</TabsTrigger>
          <TabsTrigger value="class">Classes</TabsTrigger>
          <TabsTrigger value="result">Results</TabsTrigger>
          <TabsTrigger value="submission">Submissions</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const config = typeConfig[n.type];
                const Icon = config.icon;
                return (
                  <Card
                    key={n.id}
                    className={`bg-card/80 backdrop-blur-md border-border/50 cursor-pointer transition-all hover:bg-secondary/30 ${!n.read ? "border-l-2 border-l-primary" : ""}`}
                    onClick={() => { markAsRead(n.id); navigate(n.linkTo); }}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className={`rounded-full p-2.5 shrink-0 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.timestamp}</p>
                      </div>
                      {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
