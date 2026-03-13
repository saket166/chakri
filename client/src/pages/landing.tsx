import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Users, Briefcase, Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { api, setSession } from "@/lib/api";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Step = "form" | "otp";

export default function Landing({ onLogin }: { onLogin?: () => void }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shared OTP state
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

  const enterApp = (user: any) => {
    setSession(user.id, user);
    onLogin?.();
    setLocation("/home");
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await api.auth.signup({ name, email, password, phone, headline, company, location: userLocation });
      setPendingUserId(res.userId);
      setPendingEmail(email);
      setStep("otp");
    } catch (e: any) { setError(e.message || "Signup failed."); }
    finally { setLoading(false); }
  };

  // ── OTP Verify ───────────────────────────────────────────────────────────
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
    setResendCooldown(30);
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await api.auth.signin(loginEmail, loginPassword);
      enterApp(user);
    } catch (e: any) { setError(e.message || "Sign in failed."); }
    finally { setLoading(false); }
  };

  // ── OTP Screen ───────────────────────────────────────────────────────────
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
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
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
            <p className="text-xs text-center text-muted-foreground">
              Can't find the email? Check your spam folder.<br/>
              {!import.meta.env.VITE_RESEND_CONFIGURED && (
                <span className="text-yellow-600">📋 Dev mode: check server logs for the OTP code.</span>
              )}
            </p>
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
              <div className="space-y-6">
                <h1 className="text-5xl font-bold tracking-tight">
                  Get Your Dream Job Through{" "}
                  <span className="text-primary">Referrals</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Connect with professionals, request referrals, and earn Chakri coins by helping others land their dream jobs.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div>
                    <div><p className="font-semibold">10K+ Users</p><p className="text-sm text-muted-foreground">Active network</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"><Briefcase className="h-6 w-6 text-primary" /></div>
                    <div><p className="font-semibold">5K+ Referrals</p><p className="text-sm text-muted-foreground">Success stories</p></div>
                  </div>
                </div>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Welcome to Chakri</CardTitle>
                  <CardDescription>Sign in or create an account to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    {/* ── SIGN IN ── */}
                    <TabsContent value="login" className="space-y-4 pt-2">
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
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sign In
                        </Button>
                      </form>
                    </TabsContent>

                    {/* ── SIGN UP ── */}
                    <TabsContent value="signup" className="space-y-3 pt-2">
                      <form onSubmit={handleSignup} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Full Name *</Label>
                          <Input placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email *</Label>
                          <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Phone</Label>
                          <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Current Role</Label>
                          <Input placeholder="Software Engineer at Infosys" value={headline} onChange={e => setHeadline(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label>Company</Label>
                            <Input placeholder="Infosys" value={company} onChange={e => setCompany(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Location</Label>
                            <Input placeholder="Bengaluru" value={userLocation} onChange={e => setUserLocation(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Password *</Label>
                          <Input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Confirm Password *</Label>
                          <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create Account & Verify Email
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">🎁 500 Chakri Coins welcome bonus after verification!</p>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How Chakri Works</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Users,    title: "Connect",          desc: "Build your professional network with people at your target companies" },
                { icon: Briefcase,title: "Request Referrals", desc: "Post referral requests that match your skills and career goals" },
                { icon: Award,    title: "Earn Coins",        desc: "Help others and earn Chakri coins for every successful referral" },
              ].map(item => (
                <Card key={item.title}><CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><item.icon className="h-6 w-6 text-primary" /></div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader></Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Chakri. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
