import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Mail, MessageSquare, Bug, Send, CheckCircle } from "lucide-react";
import { getCachedUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const profile = getCachedUser() || {};
  const [form, setForm] = useState({ name: profile.name || "", email: profile.email || "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.email.trim() || !form.message.trim()) {
      toast({ title: "Please fill in email and message", variant: "destructive" }); return;
    }
    // Opens the user's email client with pre-filled content
    const mailto = `mailto:chakri.prod@google.com?subject=${encodeURIComponent(form.subject || "Chakri Support Request")}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.open(mailto, "_blank");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Message Ready!</h2>
        <p className="text-muted-foreground mb-6">Your email client should have opened with a pre-filled message to chakri.prod@google.com. If it didn't open, email us directly at that address.</p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another Message</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Contact Us</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Mail,         title: "Email Support",  desc: "chakri.prod@google.com", sub: "Response within 24 hours" },
          { icon: Bug,          title: "Report a Bug",   desc: "chakri.prod@google.com", sub: "Help us improve" },
          { icon: MessageSquare,title: "General Query",  desc: "chakri.prod@google.com", sub: "Partnerships & more" },
        ].map(item => (
          <Card key={item.title} className="hover:shadow-md transition-all cursor-pointer" onClick={() => window.open(`mailto:${item.desc}`)}>
            <CardContent className="p-5 text-center">
              <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-primary text-sm mt-1">{item.desc}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />Send us a message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Your Name</Label>
              <Input placeholder="Priya Sharma" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input placeholder="e.g. Bug report, Feature request, Question..." value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea placeholder="Describe your issue or question in detail..." rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />Send Message
          </Button>
          <p className="text-xs text-center text-muted-foreground">This will open your email client with your message pre-filled.</p>
        </CardContent>
      </Card>
    </div>
  );
}
