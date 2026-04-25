import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Users, Briefcase, Loader2, Mail, ArrowLeft, RefreshCw, CheckCircle, Zap, Shield } from "lucide-react";
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [userLocation, setUserLocation] = useState("");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(loginEmail.trim())) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const user = await api.auth.signin(loginEmail, loginPassword);
      enterApp(user);
    } catch (e: any) {
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

  // ── OTP Screen ─────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-hero px-4">
        <Card className="w-full max-w-md shadow-xl glass">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg pulse-glow">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="mt-1">
              We sent a 6-digit code to<br />
              <span className="font-semibold text-foreground">{pendingEmail}</span>
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
            {error && <p className="text-sm text-destructive text-center bg-destructive/8 rounded-lg py-2">{error}</p>}
            <Button className="w-full h-11 text-base font-semibold" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enter Chakri
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />Back
              </button>
              <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50 transition-colors">
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

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-black text-lg leading-none">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Chakri</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Secure · Verified profiles only</span>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero Section ── */}
        <section className="mesh-hero relative overflow-hidden">

          {/* Decorative orbs */}
          <div className="pointer-events-none absolute top-20 left-8 h-64 w-64 rounded-full bg-primary/8 blur-3xl animate-float" />
          <div className="pointer-events-none absolute top-32 right-12 h-48 w-48 rounded-full bg-rose-400/10 blur-2xl animate-float-delayed" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

          <div className="container mx-auto px-4 pt-16 pb-20 relative">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* ── Left: Copy ── */}
              <div className="space-y-7">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">India's Referral Network</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl sm:text-6xl font-black leading-[1.08]">
                    Land your dream job<br />
                    through{" "}
                    <span className="gradient-text">referrals</span>
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                    Connect with insiders at your target companies, request referrals, and earn coins by helping others get hired.
                  </p>
                </div>

                {/* Feature pills */}
                <div className="space-y-3">
                  {[
                    { icon: Users,    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",   label: "Connect", desc: "Build your network at top companies" },
                    { icon: Briefcase,color: "bg-primary/10 text-primary",                                          label: "Request", desc: "Post referral requests & get hired" },
                    { icon: Award,    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",label: "Earn",    desc: "Get Chakri Coins for every referral you give" },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm hover-lift-sm">
                      <div className={`h-10 w-10 rounded-lg ${f.color} flex items-center justify-center shrink-0`}>
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-none mb-0.5">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Trust line */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>500 Chakri Coins welcome bonus for every new member</span>
                </div>
              </div>

              {/* ── Right: Auth Card ── */}
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-primary/8 rounded-3xl blur-2xl" />
                <Card className="relative shadow-2xl border-border/60 overflow-hidden">
                  {/* Top accent stripe */}
                  <div className="h-1 w-full bg-gradient-to-r from-primary via-rose-400 to-primary/40" />
                  <CardHeader className="pb-0 pt-6">
                    <CardTitle className="text-xl">Welcome to Chakri</CardTitle>
                    <CardDescription>Sign in or create your account</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>

                      {/* ── SIGN IN ── */}
                      <TabsContent value="login" className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                            <Input type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-11" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                            <Input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-11" />
                          </div>
                          {error && <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>}
                          <Button type="submit" className="w-full h-11 font-semibold text-base" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sign In
                          </Button>
                          <p className="text-center text-sm">
                            <Link href="/forgot-password" className="text-primary hover:underline font-medium">Forgot password?</Link>
                          </p>
                        </form>
                      </TabsContent>

                      {/* ── SIGN UP ── */}
                      <TabsContent value="signup" className="space-y-3">
                        <form onSubmit={handleSignup} className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                            <Input placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</Label>
                            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                            <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Role</Label>
                            <Input placeholder="Software Engineer at Infosys" value={headline} onChange={e => setHeadline(e.target.value)} className="h-10" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</Label>
                              <Input placeholder="Infosys" value={company} onChange={e => setCompany(e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
                              <Input placeholder="Bengaluru" value={userLocation} onChange={e => setUserLocation(e.target.value)} className="h-10" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password *</Label>
                              <Input type="password" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} required className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm *</Label>
                              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-10" />
                            </div>
                          </div>
                          {error && <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>}
                          <Button type="submit" className="w-full h-11 font-semibold text-base" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Free Account
                          </Button>
                          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            <span>🎁 500 Coins welcome bonus · Email verification required</span>
                          </div>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="py-20 border-t border-border/60">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Simple Process</p>
              <h2 className="text-4xl font-black">How Chakri Works</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">Three steps from signup to your dream referral</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Users,    step: "01", title: "Connect",          desc: "Build your professional network with verified employees at top companies",          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
                { icon: Briefcase,step: "02", title: "Request Referrals", desc: "Post referral requests for specific positions and let insiders reach out to you", color: "bg-primary/10 text-primary" },
                { icon: Award,    step: "03", title: "Earn & Grow",       desc: "Earn Chakri Coins for every successful referral you give — redeem in marketplace", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
              ].map((item, i) => (
                <div key={item.title} className="relative group card-premium p-6 flex flex-col">
                  <span className="text-6xl font-black text-muted/60 absolute top-4 right-5 select-none leading-none">{item.step}</span>
                  <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center mb-5 relative shadow-sm`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-[10px]">C</span>
            </div>
            <span className="font-semibold text-foreground">Chakri</span>
            <span>© 2026 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
