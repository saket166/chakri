import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Award, Users, Briefcase, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { api, setSession } from "@/lib/api";
import { randomUUID } from "@/lib/uuid";

export default function Landing({ onLogin }: { onLogin?: () => void }) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupHeadline, setSignupHeadline] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupLocation, setSignupLocation] = useState("");

  // Google flow
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleCompany, setGoogleCompany] = useState("");
  const [googleHeadline, setGoogleHeadline] = useState("");
  const [googleLocation, setGoogleLocation] = useState("");

  const enterApp = (user: any) => {
    setSession(user.id, user);
    onLogin?.();
    setLocation("/home");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // For email login: we use the email as the user ID key (deterministic UUID from email)
      const id = await deterministicId(loginEmail);
      const user = await api.auth.upsert(id, loginEmail, "");
      enterApp(user);
    } catch (e: any) { setError("Login failed. Please check your details."); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (!signupName.trim() || !signupEmail.trim()) { setError("Name and email are required."); setLoading(false); return; }
    try {
      const id = await deterministicId(signupEmail);
      const user = await api.auth.upsert(id, signupEmail, signupName);
      // Save additional profile fields
      await api.auth.update({ phone: signupPhone, headline: signupHeadline, company: signupCompany, location: signupLocation });
      enterApp({ ...user, name: signupName, company: signupCompany, headline: signupHeadline });
    } catch (e: any) { setError("Signup failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGooglePromptSubmit = async () => {
    setError(""); setLoading(true);
    if (!googleName.trim() || !googleEmail.trim()) { setError("Name and email are required."); setLoading(false); return; }
    try {
      const id = await deterministicId(googleEmail);
      const user = await api.auth.upsert(id, googleEmail, googleName);
      await api.auth.update({ company: googleCompany, headline: googleHeadline, location: googleLocation });
      enterApp({ ...user, name: googleName, company: googleCompany, headline: googleHeadline });
    } catch (e: any) { setError("Failed. Please try again."); }
    finally { setLoading(false); }
  };

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
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div><p className="font-semibold">10K+ Users</p><p className="text-sm text-muted-foreground">Active network</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
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
                  {showGooglePrompt ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <SiGoogle className="h-5 w-5 text-blue-500 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">Complete your Chakri profile</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input placeholder="Priya Sharma" value={googleName} onChange={e => setGoogleName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="you@gmail.com" value={googleEmail} onChange={e => setGoogleEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Role</Label>
                        <Input placeholder="Software Engineer at Infosys" value={googleHeadline} onChange={e => setGoogleHeadline(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2"><Label>Company</Label><Input placeholder="Infosys" value={googleCompany} onChange={e => setGoogleCompany(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Location</Label><Input placeholder="Bengaluru" value={googleLocation} onChange={e => setGoogleLocation(e.target.value)} /></div>
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <Button className="w-full" onClick={handleGooglePromptSubmit} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Complete Sign Up 🎉
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">🎁 Get 500 Chakri Coins as welcome bonus!</p>
                    </div>
                  ) : (
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>

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
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sign In
                          </Button>
                        </form>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><Separator /></div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setShowGooglePrompt(true)}>
                          <SiGoogle className="h-4 w-4 mr-2" />Continue with Google
                        </Button>
                      </TabsContent>

                      <TabsContent value="signup" className="space-y-4">
                        <form onSubmit={handleSignup} className="space-y-3">
                          <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Priya Sharma" value={signupName} onChange={e => setSignupName(e.target.value)} required /></div>
                          <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required /></div>
                          <div className="space-y-2"><Label>Phone</Label><Input type="tel" placeholder="+91 98765 43210" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Current Role</Label><Input placeholder="Software Engineer at Infosys" value={signupHeadline} onChange={e => setSignupHeadline(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2"><Label>Company</Label><Input placeholder="Infosys" value={signupCompany} onChange={e => setSignupCompany(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Location</Label><Input placeholder="Bengaluru" value={signupLocation} onChange={e => setSignupLocation(e.target.value)} /></div>
                          </div>
                          <div className="space-y-2"><Label>Password *</Label><Input type="password" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required /></div>
                          {error && <p className="text-sm text-destructive">{error}</p>}
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Account
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">🎁 Get 500 Chakri Coins as welcome bonus!</p>
                        </form>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><Separator /></div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setShowGooglePrompt(true)}>
                          <SiGoogle className="h-4 w-4 mr-2" />Continue with Google
                        </Button>
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How Chakri Works</h2>
              <p className="text-muted-foreground">Simple, effective, and rewarding</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Users, title: "Connect", desc: "Build your professional network with people working at your target companies" },
                { icon: Briefcase, title: "Request Referrals", desc: "Post referral requests that match your skills and career goals" },
                { icon: Award, title: "Earn Coins", desc: "Help others and earn Chakri coins for every successful referral" },
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

// Deterministic UUID from email using subtle crypto — same email always gets same ID
async function deterministicId(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  const arr = Array.from(new Uint8Array(buf));
  const hex = arr.map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
