import { useState, useRef } from "react";
import { Settings, User, Bell, Palette, Shield, Camera, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser, useRole } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { toast } = useToast();
  const { firstName, middleName, lastName, studentId, email, profilePhoto, setUser, setProfilePhoto } = useUser();
  const { role } = useRole();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({ firstName, middleName, lastName, email, bio: "Full-stack developer passionate about clean code." });
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("apex-notification-prefs");
    return stored ? JSON.parse(stored) : { email: true, push: true, examReminders: true, results: false, marketing: false };
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    setUser({ firstName: profile.firstName, middleName: profile.middleName, lastName: profile.lastName, email: profile.email, studentId });
    toast({ title: "Settings saved", description: "Your profile has been updated." });
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("apex-notification-prefs", JSON.stringify(notifications));
    toast({ title: "Preferences saved", description: "Your notification preferences have been updated." });
  };

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New password and confirmation do not match.", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
            <CardContent className="space-y-6">
              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    {profilePhoto && <AvatarImage src={profilePhoto} alt="Profile" />}
                    <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                      {[profile.firstName, profile.lastName].filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-5 w-5 text-foreground" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast({ title: "File too large", description: "Please choose an image under 2 MB.", variant: "destructive" });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfilePhoto(reader.result as string);
                        toast({ title: "Photo updated", description: "Your profile photo has been changed." });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2 MB.</p>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                    {profilePhoto && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setProfilePhoto(""); toast({ title: "Photo removed" }); }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" value={profile.middleName} onChange={(e) => setProfile({ ...profile, middleName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} readOnly disabled className="opacity-70 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center h-10">
                    <Badge variant="secondary" className="text-sm">{role === "teacher" ? "Teacher" : "Student"}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSave} className="gap-2">
                <Settings className="h-4 w-4" /> Save Changes
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input id="current-pw" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input id="new-pw" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm Password</Label>
                  <Input id="confirm-pw" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handlePasswordUpdate}>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
