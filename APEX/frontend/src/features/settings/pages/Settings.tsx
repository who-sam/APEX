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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser, useRole, useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/useProfile";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { deleteAccount } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { firstName, middleName, lastName, studentId, email } = useUser();
  const { role } = useRole();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { data: profileData } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhoto = profileData?.profile?.avatar_url || null;
  const [profile, setProfile] = useState({ firstName, middleName, lastName, email, bio: "" });
  const [notifications, setNotifications] = useState({ email: true, push: true, examReminders: true, results: false });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [originalNotifications, setOriginalNotifications] = useState(notifications);

  // Load bio + notification prefs from API once profile data arrives
  if (profileData && !profileLoaded) {
    const prof = profileData.profile || {};
    const loadedProfile = { firstName, middleName, lastName, email, bio: prof.bio || "" };
    setProfile(loadedProfile);
    setOriginalProfile(loadedProfile);
    const loadedNotifications = {
      email: prof.notify_email ?? true,
      push: prof.notify_push ?? true,
      examReminders: prof.notify_exam_reminders ?? true,
      results: prof.notify_results ?? false,
    };
    setNotifications(loadedNotifications);
    setOriginalNotifications(loadedNotifications);
    setProfileLoaded(true);
  }

  const isProfileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);
  const isNotificationsDirty = JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
  const isPasswordDirty = currentPassword !== "" || newPassword !== "" || confirmPassword !== "";

  const handleSave = async () => {
    const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ");
    try {
      await updateProfileMutation.mutateAsync({ name: fullName, bio: profile.bio });
      setOriginalProfile(profile);
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        notify_email: notifications.email,
        notify_push: notifications.push,
        notify_exam_reminders: notifications.examReminders,
        notify_results: notifications.results,
      });
      setOriginalNotifications(notifications);
      toast({ title: "Preferences saved", description: "Your notification preferences have been updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      logout();
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsDeletingAccount(false);
    }
  };

  const handlePasswordUpdate = async () => {
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
    try {
      await changePasswordMutation.mutateAsync({ current_password: currentPassword, new_password: newPassword });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast({ title: "File too large", description: "Please choose an image under 2 MB.", variant: "destructive" });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const dataUrl = reader.result as string;
                        try {
                          await updateProfileMutation.mutateAsync({ avatar_url: dataUrl });
                          toast({ title: "Photo updated", description: "Your profile photo has been changed." });
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                        }
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
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={async () => { try { await updateProfileMutation.mutateAsync({ avatar_url: "" }); toast({ title: "Photo removed" }); } catch {} }}>
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
              <Button onClick={handleSave} disabled={!isProfileDirty} className="gap-2">
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
              <Button onClick={handleSaveNotifications} disabled={!isNotificationsDirty}>Save Preferences</Button>
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
              <Button onClick={handlePasswordUpdate} disabled={!isPasswordDirty}>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanent actions that cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Button variant="destructive" onClick={() => { setDeleteConfirmText(""); setShowDeleteDialog(true); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data. This action cannot be undone.
              Type <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
