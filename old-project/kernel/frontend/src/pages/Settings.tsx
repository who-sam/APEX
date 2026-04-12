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
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/useProfile";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const { theme, setTheme } = useTheme();
  const { data: profileData } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [profile, setProfile] = useState({ name, email, bio: "" });
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("kernel-notification-prefs");
    return stored ? JSON.parse(stored) : { email: true, push: true, examReminders: true, results: false, marketing: false };
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Populate from backend profile
  useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.name || name,
        email: profileData.email || email,
        bio: profileData.bio || "",
      });
    }
  }, [profileData]);

  const handleSave = () => {
    updateProfile.mutate(
      { name: profile.name, bio: profile.bio },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your profile has been updated." });
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err.message || "Something went wrong.", variant: "destructive" });
        },
      }
    );
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("kernel-notification-prefs", JSON.stringify(notifications));
    updateProfile.mutate(
      {
        notify_email: notifications.email,
        notify_push: notifications.push,
        notify_exam_reminders: notifications.examReminders,
        notify_results: notifications.results,
      },
      {
        onSuccess: () => {
          toast({ title: "Preferences saved", description: "Your notification preferences have been updated." });
        },
        onError: () => {
          toast({ title: "Preferences saved locally", description: "Your notification preferences have been updated." });
        },
      }
    );
  };

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "Error", description: "Please fill in both password fields.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          toast({ title: "Password updated", description: "Your password has been changed successfully." });
          setCurrentPassword("");
          setNewPassword("");
        },
        onError: (err: any) => {
          toast({ title: "Password update failed", description: err.message || "Check your current password.", variant: "destructive" });
        },
      }
    );
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
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSave} className="gap-2" disabled={updateProfile.isPending}>
                <Settings className="h-4 w-4" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
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
                { key: "marketing" as const, label: "Marketing Emails", desc: "Tips, product updates, and offers" },
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
              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
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
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input id="current-pw" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input id="new-pw" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handlePasswordUpdate} disabled={changePassword.isPending}>
                {changePassword.isPending ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
