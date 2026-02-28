import { useState, useEffect } from "react";
import { Settings, User, Bell, Palette, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, updateProfile, changePassword } from "@/lib/api";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", bio: "" });
  const [notifications, setNotifications] = useState({ email: true, push: true, examReminders: true, results: false });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile((prev) => ({ ...prev, bio: p.bio || "" }));
        setNotifications({
          email: p.notify_email,
          push: p.notify_push,
          examReminders: p.notify_exam_reminders,
          results: p.notify_results,
        });
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ bio: profile.bio });
      toast({ title: "Profile saved", description: "Your profile has been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateProfile({
        notify_email: notifications.email,
        notify_push: notifications.push,
        notify_exam_reminders: notifications.examReminders,
        notify_results: notifications.results,
      });
      toast({ title: "Settings saved", description: "Your notification preferences have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) return;
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.new);
      toast({ title: "Password updated", description: "Your password has been changed." });
      setPasswords({ current: "", new: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSaveProfile} className="gap-2" disabled={saving}>
                <Settings className="h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email" },
                { key: "push" as const, label: "Push Notifications", desc: "Browser push notifications" },
                { key: "examReminders" as const, label: "Exam Reminders", desc: "Get reminded before upcoming exams" },
                { key: "results" as const, label: "Result Alerts", desc: "Notify when results are published" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                  />
                </div>
              ))}
              <Separator />
              <Button onClick={handleSaveNotifications} disabled={saving}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                </div>
                <Switch
                  checked={document.documentElement.classList.contains("dark")}
                  onCheckedChange={() => document.documentElement.classList.toggle("dark")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>Manage your password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input id="current-pw" type="password" placeholder="********" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input id="new-pw" type="password" placeholder="********" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={saving}>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
