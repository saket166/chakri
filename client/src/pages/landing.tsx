import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Award, Users, Briefcase } from "lucide-react";
import { SiGoogle, SiGithub, SiApple } from "react-icons/si";
import heroImage from "@assets/generated_images/Hero_networking_illustration_76d2179d.png";
import { saveProfile, setLoggedIn, getProfile } from "@/lib/userStore";

export default function Landing({ onLogin }: { onLogin?: () => void }) {
  const [, setLocation] = useLocation();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupHeadline, setSignupHeadline] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupLocation, setSignupLocation] = useState("");
  const [signupError, setSignupError] = useState("");
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const stored = getProfile();
    // Allow login if email matches what was signed up with, or if no account yet (demo mode)
    if (!stored.email || stored.email === loginEmail) {
      setLoggedIn(true);
      setLocation("/home");
    } else {
      setLoginError("Email not found. Please sign up first.");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (!signupName.trim()) { setSignupError("Please enter your name."); return; }
    if (!signupEmail.trim()) { setSignupError("Please enter your email."); return; }
    if (!signupPassword.trim()) { setSignupError("Please enter a password."); return; }

    saveProfile({
      name: signupName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim(),
      headline: signupHeadline.trim(),
      company: signupCompany.trim(),
      location: signupLocation.trim(),
      points: 500, // welcome bonus
    });
    setLoggedIn(true);
    onLogin?.();
    setLocation("/home");
  };

  // Simulate Google OAuth prefill — in production this comes from Supabase session
  const handleGoogleLogin = () => {
    // In production, Supabase returns the Google user's name + email automatically.
    // For now we pre-fill the signup form with a prompt to complete their profile.
    setSignupName(""); // will be filled by Google in production
    setSignupEmail(""); // will be filled by Google in production
    // Switch to signup tab so they can complete remaining fields
    setShowGooglePrompt(true);
  };

  const handleGoogleComplete = () => {
    if (!signupName.trim()) { setSignupError("Please enter your name."); return; }
    saveProfile({
      name: signupName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim(),
      headline: signupHeadline.trim(),
      company: signupCompany.trim(),
      location: signupLocation.trim(),
      points: 500,
    });
    setLoggedIn(true);
    onLogin?.();
    setLocation("/home");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl">Chakri</span>
          </div>
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
                  Connect with professionals, request referrals, and earn Chakri points by helping others land their dream jobs.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">10K+ Users</p>
                      <p className="text-sm text-muted-foreground">Active network</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">5K+ Referrals</p>
                      <p className="text-sm text-muted-foreground">Success stories</p>
                    </div>
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
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-2">
                        <SiGoogle className="h-5 w-5 text-blue-500 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">Complete your Chakri profile to continue</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input placeholder="Priya Sharma" value={signupName} onChange={e => setSignupName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="you@gmail.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Role / Headline</Label>
                        <Input placeholder="Software Engineer at Infosys" value={signupHeadline} onChange={e => setSignupHeadline(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input placeholder="Infosys" value={signupCompany} onChange={e => setSignupCompany(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input placeholder="Bengaluru" value={signupLocation} onChange={e => setSignupLocation(e.target.value)} />
                        </div>
                      </div>
                      {signupError && <p className="text-sm text-destructive">{signupError}</p>}
                      <Button className="w-full" onClick={handleGoogleComplete}>Complete Sign Up 🎉</Button>
                      <p className="text-xs text-center text-muted-foreground">🎁 Get 500 Chakri Coins as a welcome bonus!</p>
                    </div>
                  ) : (
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
                    </TabsList>

                    {/* LOGIN TAB */}
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input id="login-email" type="email" placeholder="you@example.com"
                            value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                            data-testid="input-login-email" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input id="login-password" type="password" placeholder="••••••••"
                            value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                            data-testid="input-login-password" required />
                        </div>
                        {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                        <Button type="submit" className="w-full" data-testid="button-login">Sign In</Button>
                      </form>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><Separator /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={handleGoogleLogin} data-testid="button-google-login"><SiGoogle className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => alert("GitHub sign-in coming soon!")} data-testid="button-github-login"><SiGithub className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => alert("Apple sign-in coming soon!")} data-testid="button-apple-login"><SiApple className="h-4 w-4" /></Button>
                      </div>
                    </TabsContent>

                    {/* SIGNUP TAB */}
                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleSignup} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name *</Label>
                          <Input id="signup-name" placeholder="Priya Sharma"
                            value={signupName} onChange={(e) => setSignupName(e.target.value)}
                            data-testid="input-signup-name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email *</Label>
                          <Input id="signup-email" type="email" placeholder="you@example.com"
                            value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                            data-testid="input-signup-email" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">Phone Number</Label>
                          <Input id="signup-phone" type="tel" placeholder="+91 98765 43210"
                            value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)}
                            data-testid="input-signup-phone" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-headline">Current Role / Headline</Label>
                          <Input id="signup-headline" placeholder="Software Engineer at Infosys"
                            value={signupHeadline} onChange={(e) => setSignupHeadline(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="signup-company">Company</Label>
                            <Input id="signup-company" placeholder="Infosys"
                              value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-location">Location</Label>
                            <Input id="signup-location" placeholder="Bengaluru, KA"
                              value={signupLocation} onChange={(e) => setSignupLocation(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password *</Label>
                          <Input id="signup-password" type="password" placeholder="••••••••"
                            value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                            data-testid="input-signup-password" required />
                        </div>
                        {signupError && <p className="text-sm text-destructive">{signupError}</p>}
                        <Button type="submit" className="w-full" data-testid="button-signup">
                          Create Account
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">🎁 Get 500 Chakri Coins as a welcome bonus!</p>
                      </form>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><Separator /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" onClick={handleGoogleLogin} data-testid="button-google-signup"><SiGoogle className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => alert("GitHub sign-in coming soon!")} data-testid="button-github-signup"><SiGithub className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => alert("Apple sign-in coming soon!")} data-testid="button-apple-signup"><SiApple className="h-4 w-4" /></Button>
                      </div>
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
              <Card><CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Users className="h-6 w-6 text-primary" /></div>
                <CardTitle>Connect</CardTitle>
                <CardDescription>Build your professional network with people working at your target companies</CardDescription>
              </CardHeader></Card>
              <Card><CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Briefcase className="h-6 w-6 text-primary" /></div>
                <CardTitle>Request Referrals</CardTitle>
                <CardDescription>Post referral requests that match your skills and career goals</CardDescription>
              </CardHeader></Card>
              <Card><CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><Award className="h-6 w-6 text-primary" /></div>
                <CardTitle>Earn Points</CardTitle>
                <CardDescription>Help others and earn 500 Chakri points for every successful referral</CardDescription>
              </CardHeader></Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Chakri. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
