import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Users, Briefcase, Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api, setSession } from "@/lib/api";
import { Link } from "wouter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Step = "form" | "otp";

export default function Landing({ onLogin }: { onLogin?: () => void }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sign up fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [userLocation, setUserLocation] = useState("");

  // Sign in fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const enterApp = (userWithToken: any) => {
    const { token, ...user } = userWithToken;
    setSession(user.id, user, token);
    onLogin?.();
    setLocation("/home");
  };

  const startResendTimer = () => {
    setResendCooldown(30);
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!EMAIL_RE.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await api.auth.signup({ name, email, password, phone, headline, company, location: userLocation });
      setPendingUserId(res.userId);
      setPendingEmail(email);
      setStep("otp");
      startResendTimer();
    } catch (e: any) { setError(e.message || "Signup failed."); }
    finally { setLoading(false); }
  };

  // ── Sign In ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(loginEmail.trim())) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const user = await api.auth.signin(loginEmail, loginPassword);
      enterApp(user);
    } catch (e: any) {
      // If account not verified, send to OTP screen
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.needsVerification) {
          setPendingUserId(parsed.userId);
          setPendingEmail(loginEmail);
          setStep("otp");
          startResendTimer();
          return;
        }
        setError(parsed.error || "Sign in failed.");
      } catch {
        setError(e.message || "Sign in failed.");
      }
    }
    finally { setLoading(false); }
  };

  // ── OTP Verify ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const user = await api.auth.verifyOtp(pendingUserId, otp);
      enterApp(user);
    } catch (e: any) { setError(e.message || "Invalid OTP."); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    await api.auth.resendOtp(pendingUserId);
    startResendTimer();
  };

  // ── OTP Screen ─────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a 6-digit verification code to<br />
              <span className="font-medium text-foreground">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} />
                  <InputOTPSlot index={2} /><InputOTPSlot index={3} />
                  <InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button className="w-full" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enter Chakri
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />Back
              </button>
              <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50">
                <RefreshCw className="h-3.5 w-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Can't find it? Check your spam folder.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl">Chakri</span>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 lg:pr-12">
                <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  The Fast Track to your <br className="hidden lg:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Dream Job.</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Skip the cold emails. Chakri connects you directly with insiders for guaranteed referrals.
                </p>
                <div className="flex items-center gap-6 pt-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full border-2 border-background bg-blue-100 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-blue-600" /></div>
                      <div className="h-8 w-8 rounded-full border-2 border-background bg-green-100 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-green-600" /></div>
                      <div className="h-8 w-8 rounded-full border-2 border-background bg-amber-100 flex items-center justify-center"><Award className="h-3.5 w-3.5 text-amber-600" /></div>
                    </div>
                    <span>Join 5,000+ top professionals</span>
                  </div>
                </div>
              </div>

              <Card className="shadow-2xl shadow-primary/5 border-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Create Account</TabsTrigger>
                    </TabsList>

                    {/* ── SIGN IN ── */}
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sign In
                        </Button>
                        <p className="text-center text-sm">
                          <Link href="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">Forgot your password?</Link>
                        </p>
                      </form>
                    </TabsContent>

                    {/* ── SIGN UP ── */}
                    <TabsContent value="signup" className="space-y-3">
                      <form onSubmit={handleSignup} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label className="text-xs">Full Name *</Label><Input className="h-9" placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Email *</Label><Input className="h-9" type="email" placeholder="you@domain.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label className="text-xs">Password *</Label><Input className="h-9" type="password" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Confirm Password *</Label><Input className="h-9" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label className="text-xs">Current Role</Label><Input className="h-9" placeholder="Software Engineer" value={headline} onChange={e => setHeadline(e.target.value)} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Company</Label><Input className="h-9" placeholder="Infosys" value={company} onChange={e => setCompany(e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label className="text-xs">Location</Label><Input className="h-9" placeholder="Bengaluru" value={userLocation} onChange={e => setUserLocation(e.target.value)} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input className="h-9" type="tel" placeholder="+91..." value={phone} onChange={e => setPhone(e.target.value)} /></div>
                        </div>
                        
                        {error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{error}</p>}
                        <Button type="submit" className="w-full h-11 text-base font-medium mt-2" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Account
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-1">🎁 Create an account to receive 500 bonus coins!</p>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Chakri. All rights reserved. · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link></p>
        </div>
      </footer>
    </div>
  );
}
