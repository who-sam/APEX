import { useState, useEffect } from "react";
import { Mail, MailOpen, Star, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getMessages, markMessageRead, toggleMessageStar, deleteMessage } from "@/lib/api";
import type { MessageData } from "@/lib/api";

const typeColor = (t: string) => {
  if (t === "system") return "bg-primary/15 text-primary border-primary/30";
  if (t === "feedback") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (t === "group") return "bg-accent/15 text-accent border-accent/30";
  return "bg-secondary text-secondary-foreground border-border";
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = messages.find((m) => m.id === selectedId);
  const filtered = messages.filter((m) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    (m.from_user?.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const unread = messages.filter((m) => !m.read).length;

  const handleSelect = async (msg: MessageData) => {
    setSelectedId(msg.id);
    if (!msg.read) {
      try {
        await markMessageRead(msg.id);
        setMessages((ms) => ms.map((m) => m.id === msg.id ? { ...m, read: true } : m));
      } catch {}
    }
  };

  const handleToggleStar = async (id: number) => {
    try {
      await toggleMessageStar(id);
      setMessages((ms) => ms.map((m) => m.id === id ? { ...m, starred: !m.starred } : m));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMessage(id);
      setMessages((ms) => ms.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {}
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="mt-1 text-muted-foreground">{unread} unread message{unread !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Message list */}
        <Card className="xl:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No messages</p>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                    selectedId === msg.id ? "bg-primary/5 border border-primary/30" : "hover:bg-secondary/50"
                  } ${!msg.read ? "bg-secondary/30" : ""}`}
                >
                  <Avatar className="h-9 w-9 mt-0.5">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {(msg.from_user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${!msg.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {msg.from_user?.name || "System"}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${!msg.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{msg.subject}</p>
                  </div>
                  {!msg.read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Message detail */}
        <Card className="xl:col-span-3 border-border/50">
          {selected ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{selected.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">From: {selected.from_user?.name || "System"}</span>
                      <Badge variant="outline" className={typeColor(selected.type)}>{selected.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleToggleStar(selected.id)}>
                      <Star className={`h-4 w-4 ${selected.starred ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(selected.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed text-foreground">{selected.body}</p>
                <p className="mt-4 text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</p>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Select a message to read</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
