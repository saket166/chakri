import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    setError(""); setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) { setError(e.message || "Something went wrong."); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Check your inbox</h2>
            <p className="text-muted-foreground text-sm">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your spam folder if you don't see it.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
              Back to Sign In
            </Button>
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
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
            <button type="button" onClick={() => setLocation("/")} className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />Back to Sign In
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
