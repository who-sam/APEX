import { useState } from "react";
import { Mail, MailOpen, Star, Trash2, Search, Plus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { useUser } from "@/contexts/AuthContext";
import { useMessages, useSendMessage, useMarkMessageRead, useToggleMessageStar, useDeleteMessage } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

const typeColor = (t: string) => {
  if (t === "system") return "bg-primary/15 text-primary border-primary/30";
  if (t === "feedback") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (t === "group") return "bg-accent/15 text-accent border-accent/30";
  return "bg-secondary text-secondary-foreground border-border";
};

export default function MessagesPage() {
  const { toast } = useToast();
  const { name: userName } = useUser();
  const { data: messagesData, isLoading, error, refetch } = useMessages();
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessageRead();
  const toggleStarMutation = useToggleMessageStar();
  const deleteMessageMutation = useDeleteMessage();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  if (isLoading) return <PageSkeleton cards={2} rows={5} />;
  if (error) return <ErrorState message="Failed to load messages" onRetry={refetch} />;

  const messages = (messagesData || []).map((m: any) => ({
    id: m.id,
    from_id: m.from_id,
    from: m.from_user?.name || m.sender_name || "Unknown",
    initials: getInitials(m.from_user?.name || m.sender_name || "?"),
    subject: m.subject || "(no subject)",
    body: m.body || "",
    time: m.created_at ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true }) : "",
    read: !!m.read,
    starred: !!m.starred,
    type: m.type || "direct",
  }));

  const selected = messages.find((m: any) => m.id === selectedId);
  const filtered = messages.filter((m: any) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from.toLowerCase().includes(search.toLowerCase())
  );
  const unread = messages.filter((m: any) => !m.read).length;

  const handleSelect = (id: number, isRead: boolean) => {
    setSelectedId(id);
    if (!isRead) markReadMutation.mutate(id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    try {
      await sendMessageMutation.mutateAsync({
        to_id: selected.from_id,
        subject: `Re: ${selected.subject}`,
        body: replyText,
        type: "direct",
      });
      toast({ title: "Reply sent", description: `Your reply to "${selected.from}" has been sent.` });
      setReplyText("");
    } catch (err: any) {
      toast({ title: "Reply failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Missing fields", description: "Please fill in recipient and subject.", variant: "destructive" });
      return;
    }
    try {
      await sendMessageMutation.mutateAsync({
        to_id: Number(composeTo),
        subject: composeSubject,
        body: composeBody,
        type: "direct",
      });
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeOpen(false);
      toast({ title: "Message sent", description: `Your message has been sent.` });
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
          <p className="mt-1 text-muted-foreground">{unread} unread message{unread !== 1 ? "s" : ""}</p>
        </div>
        <Button className="gap-2" onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4" /> New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Message list */}
        <Card className="xl:col-span-2 border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState icon={Mail} title="No messages found" description="Try adjusting your search terms." />
            ) : (
              filtered.map((msg: any) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelect(msg.id, msg.read)}
                  className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                    selectedId === msg.id ? "bg-primary/5 border border-primary/30" : "hover:bg-secondary/50"
                  } ${!msg.read ? "bg-secondary/30" : ""}`}
                >
                  <Avatar className="h-9 w-9 mt-0.5">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{msg.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${!msg.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{msg.from}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{msg.time}</span>
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
        <Card className="xl:col-span-3 border-border/50 bg-card/80 backdrop-blur-md">
          {selected ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{selected.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">From: {selected.from}</span>
                      <Badge variant="outline" className={typeColor(selected.type)}>{selected.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleStarMutation.mutate(selected.id)} aria-label="Star message">
                      <Star className={`h-4 w-4 ${selected.starred ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => markReadMutation.mutate(selected.id)} aria-label="Toggle read">
                      {selected.read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteMessageMutation.mutate(selected.id); setSelectedId(null); }} className="text-destructive hover:text-destructive" aria-label="Delete message">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm leading-relaxed text-foreground">{selected.body}</p>
                <p className="text-xs text-muted-foreground">{selected.time}</p>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Reply</p>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" className="gap-2" onClick={handleReply} disabled={!replyText.trim()}>
                    <Send className="h-3 w-3" /> Send Reply
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Select a message to read</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="To (recipient)" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} />
            <Input placeholder="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            <Textarea placeholder="Write your message..." rows={4} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleCompose} disabled={sendMessageMutation.isPending} className="gap-2">
              <Send className="h-4 w-4" /> {sendMessageMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
