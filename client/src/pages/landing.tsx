import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Users, Briefcase, Loader2, Mail, ArrowLeft, RefreshCw, ArrowRight, CheckCircle, Zap, Shield } from "lucide-react";
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
    e.preventDefault(); setError("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!EMAIL_RE.test(email.trim())) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await api.auth.signup({ name, email, password, phone, headline, company, location: userLocation });
      setPendingUserId(res.userId); setPendingEmail(email); setStep("otp"); startResendTimer();
    } catch (e: any) { setError(e.message || "Signup failed."); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!EMAIL_RE.test(loginEmail.trim())) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const user = await api.auth.signin(loginEmail, loginPassword);
      enterApp(user);
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.needsVerification) {
          setPendingUserId(parsed.userId); setPendingEmail(loginEmail); setStep("otp"); startResendTimer(); return;
        }
        setError(parsed.error || "Sign in failed.");
      } catch { setError(e.message || "Sign in failed."); }
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

  // ── OTP Screen ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a1363 50%, #24243e 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>
        <div className="glass-card rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              We sent a 6-digit code to <span className="font-semibold text-foreground">{pendingEmail}</span>
            </p>
          </div>
          <div className="flex justify-center mb-5">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error && <p className="text-sm text-destructive text-center mb-3">{error}</p>}
          <Button className="w-full h-11 font-semibold" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify & Enter Chakri
          </Button>
          <div className="flex items-center justify-between mt-4 text-sm">
            <button onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />Back
            </button>
            <button onClick={handleResendOtp} disabled={resendCooldown > 0} className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">Can't find it? Check your spam folder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Top Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{ background: "rgba(15, 12, 41, 0.85)" }}>
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-bold text-base">C</span>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Chakri</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm hidden sm:block">Already have an account?</span>
            <Button size="sm" variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent text-sm"
              onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 min-h-screen flex items-center">
        {/* Dark gradient background */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a1363 45%, #24243e 75%, #0f0c29 100%)" }} />

        {/* Ambient glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-violet-700/25 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-800/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-400/25 rounded-full px-4 py-1.5 text-sm text-violet-300 font-medium backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                India's first referral coin economy
              </div>

              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                Land your{" "}
                <span className="gradient-text">dream job</span>
                {" "}through referrals
              </h1>

              <p className="text-lg text-white/60 leading-relaxed max-w-md">
                Connect with professionals at your target companies, request referrals, and earn Chakri Coins by helping others. The karma-based hiring network.
              </p>

              {/* Feature pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Users,    label: "Connect",  sub: "Real employees, real help" },
                  { icon: Briefcase,label: "Request",  sub: "Post in 60 seconds" },
                  { icon: Award,    label: "Earn",     sub: "500 coins on signup" },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm hover:bg-white/8 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/40 to-indigo-500/40 flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{f.label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-5 text-white/40 text-xs">
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Email verified</div>
                <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-400" />Karma protected</div>
                <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-yellow-400" />24hr guarantee</div>
              </div>
            </div>

            {/* Right — Auth Card */}
            <div id="auth-card">
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-3xl blur-2xl" />
                <div className="relative glass-card rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600/10 via-transparent to-indigo-600/10 p-6 pb-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-foreground">Welcome to Chakri</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Sign in or join the network</p>
                  </div>
                  <div className="p-6">
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-5">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>

                      {/* SIGN IN */}
                      <TabsContent value="login" className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Email</Label>
                            <Input type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-11" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Password</Label>
                            <Input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-11" />
                          </div>
                          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sign In
                            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                          </Button>
                          <p className="text-center text-sm">
                            <Link href="/forgot-password" className="text-primary hover:underline font-medium">Forgot password?</Link>
                          </p>
                        </form>
                      </TabsContent>

                      {/* SIGN UP */}
                      <TabsContent value="signup" className="space-y-3">
                        <form onSubmit={handleSignup} className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Full Name *</Label>
                            <Input placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Email *</Label>
                            <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Current Role</Label>
                            <Input placeholder="SDE-2 at Infosys" value={headline} onChange={e => setHeadline(e.target.value)} className="h-10" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-sm font-medium">Company</Label>
                              <Input placeholder="Infosys" value={company} onChange={e => setCompany(e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm font-medium">Location</Label>
                              <Input placeholder="Bengaluru" value={userLocation} onChange={e => setUserLocation(e.target.value)} className="h-10" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Password *</Label>
                            <Input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Confirm Password *</Label>
                            <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-10" />
                          </div>
                          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Account
                            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                          </Button>
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 border border-amber-200/60 dark:border-amber-800/30">
                            <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>🎁 <strong>500 Chakri Coins</strong> welcome bonus · Email verification required</span>
                          </div>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-4">
              Simple & transparent
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">How Chakri works</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Three steps between you and your dream company</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { n: "01", icon: Users,    title: "Build your network",   desc: "Connect with employees already working at your target companies. Real people, real referrals.",   color: "from-violet-500 to-indigo-600" },
              { n: "02", icon: Briefcase,title: "Request a referral",   desc: "Post your referral request with your target company, role, and resume. Pay coins only when accepted.", color: "from-indigo-500 to-blue-600" },
              { n: "03", icon: Award,    title: "Earn & grow",          desc: "Help others get referred and earn Chakri Coins. Redeem them, top up your queue, or pay it forward.", color: "from-blue-500 to-cyan-600" },
            ].map((step, i) => (
              <div key={step.n} className="relative group card-hover">
                <div className="bg-card border border-border rounded-2xl p-7 h-full shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-5xl font-black text-primary/8 absolute top-5 right-6 select-none">{step.n}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-foreground">Chakri</span>
            <span className="text-muted-foreground">© 2026</span>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
