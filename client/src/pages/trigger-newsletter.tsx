import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, getCachedUser } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Loader2, Bot } from "lucide-react";

const ADMIN_EMAIL = "saketengland@gmail.com";

export default function TriggerNewsletter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getCachedUser();
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    // Access control redirect
    if (!user || user.email !== ADMIN_EMAIL) {
      setLocation("/home");
      return;
    }
  }, [user, setLocation]);

  const handleRunAgent = async () => {
    if (!confirm("Run the AI Job Scraper? This uses Gemini API to search and scrape jobs for all companies. It might take a minute.")) return;
    
    setAgentLoading(true);
    try {
      const res = await api.jobs.runAgent();
      toast({ title: "Agent Run Complete! 🤖", description: `Successfully scraped and added ${res.addedCount} new jobs to the Job Board.` });
    } catch (e: any) {
      toast({ title: "Agent failed", description: e.message, variant: "destructive" });
    } finally {
      setAgentLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Admin Console</h1>
          <p className="text-muted-foreground text-sm">Top secret admin panel. Use with extreme caution.</p>
        </div>
      </div>

      <Card className="border-indigo-200 shadow-md mb-6 bg-indigo-50/50 dark:bg-indigo-950/10">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <Bot className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Job Scraper Agent</h3>
              <p className="text-sm text-muted-foreground">Fetch new 3-10 YOE Data & SWE jobs from the web for all Chakri companies.</p>
            </div>
          </div>
          <Button 
            onClick={handleRunAgent} 
            disabled={agentLoading}
            variant="outline"
            className="w-full sm:w-auto border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-600"
          >
            {agentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
            {agentLoading ? "Scraping Jobs..." : "Run AI Agent"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ count }: { count: number }) {
  return <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>;
}
