import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <p className="text-destructive font-medium">Invalid reset link.</p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, email, newPassword);
      setDone(true);
    } catch (e: any) { setError(e.message || "Reset failed. The link may have expired."); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Password updated!</h2>
            <p className="text-muted-foreground text-sm">Your password has been reset successfully. You can now sign in.</p>
            <Button className="w-full" onClick={() => setLocation("/")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter a new password for <strong>{email}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
