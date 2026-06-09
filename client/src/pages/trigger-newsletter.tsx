import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, getCachedUser } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ShieldAlert, Loader2, Users, Send } from "lucide-react";

const ADMIN_EMAIL = "saketengland@gmail.com";

export default function TriggerNewsletter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getCachedUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    // Access control redirect
    if (!user || user.email !== ADMIN_EMAIL) {
      setLocation("/home");
      return;
    }
    fetchQueue();
  }, [user, setLocation]);

  const fetchQueue = async () => {
    try {
      const q = await api.newsletter.queue();
      setQueue(q);
    } catch (e: any) {
      toast({ title: "Failed to load queue", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleTrigger = async () => {
    if (!confirm("Are you absolutely sure you want to blast this email to ALL verified users?")) return;
    
    setLoading(true);
    try {
      const res = await api.newsletter.trigger();
      toast({ title: "Newsletter Blasted! 🚀", description: `Sent to ${res.sent} users with ${res.jobsIncluded} jobs.` });
      fetchQueue();
    } catch (e: any) {
      toast({ title: "Trigger failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-red-600">Newsletter Command Center</h1>
          <p className="text-muted-foreground text-sm">Top secret admin panel. Use with extreme caution.</p>
        </div>
      </div>

      <Card className="border-red-200 shadow-md mb-6 bg-red-50/50 dark:bg-red-950/10">
        <CardContent className="p-8 text-center">
          <Rocket className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ready to Fire?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            This will immediately assemble the HTML email containing the {queue.length} jobs below and blast it to all verified users in the database. 
            The queue will be permanently flushed after sending.
          </p>
          <Button 
            size="lg" 
            onClick={handleTrigger} 
            disabled={loading || queue.length === 0}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none transition-transform active:scale-95 text-lg h-14 px-8"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            Fire Weekly Newsletter
          </Button>
          {queue.length === 0 && (
            <p className="text-xs text-red-500 font-medium mt-3">Cannot fire empty queue. Ask Saket to curate jobs first.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="font-bold text-lg flex items-center gap-2">
          Payload Preview <Badge count={queue.length} />
        </h3>
      </div>

      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            <p>Queue is empty.</p>
          </div>
        ) : (
          queue.map((job, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wide">{job.companyName}</div>
                  <div className="font-bold text-lg">{job.roleTitle}</div>
                  <div className="text-sm mt-1 text-muted-foreground">{job.requiredSkills}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground mb-1">Referrer: {job.referrerName || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>;
}
