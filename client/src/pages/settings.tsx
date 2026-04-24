import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Trash2, HelpCircle, FileText, AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { api, getCachedUser, clearSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

async function deleteMe(): Promise<void> {
  const tok = localStorage.getItem("chakri_token") || "";
  const r = await fetch("/api/users/me", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok}` },
  });
  if (!r.ok) throw new Error((await r.json()).error || "Delete failed");
}

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const tok = localStorage.getItem("chakri_token") || "";
  const r = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to change password");
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(getCachedUser() || {});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Change password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    api.auth.me().then(setProfile).catch(() => {});
  }, []);

  const handleSave = async () => {
    await api.auth.update({ phone: profile.phone });
    toast({ title: "Settings saved!" });
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast({ title: "Please fill in all password fields", variant: "destructive" }); return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "New passwords do not match", variant: "destructive" }); return;
    }
    if (newPwd.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" }); return;
    }
    setChangingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      toast({ title: "Password changed successfully! ✅" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e: any) {
      toast({ title: e.message || "Failed to change password", variant: "destructive" });
    } finally { setChangingPwd(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMe();
      clearSession();
      setLocation("/");
    } catch (e: any) {
      toast({ title: "Could not delete account", description: e.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email || ""} disabled className="bg-muted/50 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here for security reasons</p>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={profile.phone || ""} onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" />Change Password</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Current Password</Label>
              <Input type="password" placeholder="••••••••" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="••••••••" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPwd} className="w-full">
              {changingPwd ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing…</> : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" />Support & Legal</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Contact Support", sub: "support@chakri.app", href: "mailto:support@chakri.app" },
              { label: "Report a Bug", sub: "Help us improve Chakri", href: "mailto:bugs@chakri.app" },
              { label: "Terms of Service", sub: "Our terms and conditions", href: "/terms" },
              { label: "Privacy Policy", sub: "How we handle your data", href: "/privacy" },
            ].map(item => (
              <a key={item.label} href={item.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors group">
                <div>
                  <p className="text-sm font-medium group-hover:text-primary">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <span className="text-muted-foreground text-xs">→</span>
              </a>
            ))}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Chakri</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0 · Beta</p>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Danger Zone</CardTitle></CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-destructive font-medium">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? "Deleting…" : "Yes, Delete Everything"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
