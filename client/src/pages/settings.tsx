import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Shield, Trash2, HelpCircle, FileText, AlertTriangle } from "lucide-react";
import { api, getCachedUser, clearSession } from "@/lib/api";

async function deleteMe(): Promise<void> {
  const tok = localStorage.getItem("chakri_token") || "";
  const r = await fetch("/api/users/me", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok}` },
  });
  if (!r.ok) throw new Error((await r.json()).error || "Delete failed");
}
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState(getCachedUser() || {});
  const [notifReferrals, setNotifReferrals] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.auth.me().then(setProfile).catch(() => {});
  }, []);

  const handleSave = async () => {
    await api.auth.update({ phone: profile.phone, email: profile.email });
    toast({ title: "Settings saved!" });
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
        {/* Account */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Used for login and notifications</p>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Referral requests at my company", notifReferrals, setNotifReferrals],
              ["New messages", notifMessages, setNotifMessages],
              ["System updates & announcements", notifSystem, setNotifSystem],
            ].map(([label, val, setter]) => (
              <div key={label as string} className="flex items-center justify-between">
                <Label className="cursor-pointer">{label as string}</Label>
                <Switch checked={val as boolean} onCheckedChange={setter as (v: boolean) => void} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" />Support & Legal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
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
