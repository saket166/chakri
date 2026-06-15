import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, ExternalLink, Filter, Loader2, Clock, Send } from "lucide-react";
import { Link } from "wouter";

export default function JobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch (e: any) {
      toast({ title: "Failed to load jobs", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = filter === "All" 
    ? jobs 
    : jobs.filter(j => j.category === filter || j.roleTitle.toLowerCase().includes(filter.toLowerCase()));

  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Job Board
          </h1>
          <p className="text-muted-foreground mt-1">Mid-Senior Roles (3-10 YOE) matching companies on Chakri.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        {["All", "Software Engineer", "Data Engineer", "Data Scientist"].map(f => (
          <Button 
            key={f} 
            variant={filter === f ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-full shrink-0"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Job Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold mb-2">No jobs found</h3>
            <p>We couldn't find any {filter !== "All" ? filter : ""} roles matching the criteria right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow hover:border-primary/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
              <CardHeader className="pb-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {job.companyName}
                </div>
                <CardTitle className="text-lg leading-tight">{job.roleTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> India
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {job.experienceRange}
                </div>
                {job.requiredSkills && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold mb-1">Skills:</div>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.split(',').slice(0, 3).map((skill: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{skill.trim()}</Badge>
                      ))}
                      {job.requiredSkills.split(',').length > 3 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{job.requiredSkills.split(',').length - 3}</Badge>}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/10 gap-2 flex-col sm:flex-row">
                <Button variant="outline" className="w-full sm:flex-1" asChild>
                  <a href={job.jobLink} target="_blank" rel="noopener noreferrer">
                    View <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <Button className="w-full sm:flex-1 bg-teal-600 hover:bg-teal-700" asChild>
                  {/* Link straight to referrals tab */}
                  <Link href="/referrals">
                    Referral <Send className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
