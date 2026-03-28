import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

interface Job { label: string; url: string; }

// No salary — just company, role, location
const FALLBACK_JOBS: Job[] = [
  { label: "🔥 Google · Staff Engineer · Hyderabad",        url: "https://careers.google.com/jobs/results/?q=software+engineer&location=Hyderabad" },
  { label: "⚡ Microsoft · Principal PM · Bengaluru",        url: "https://jobs.microsoft.com/en-us/search?q=product+manager&lc=Bengaluru%2C+Karnataka%2C+India" },
  { label: "🚀 Amazon · SDE-3 · Bengaluru",                 url: "https://www.amazon.jobs/en/search?base_query=SDE&loc_query=Bangalore%2C+Karnataka%2C+IND" },
  { label: "💼 Flipkart · Engineering Manager · Bengaluru",  url: "https://www.flipkartcareers.com/#!/joblist" },
  { label: "🌟 Meesho · VP Product · Remote",               url: "https://meesho.io/jobs" },
  { label: "🔥 Zepto · Lead Backend Engineer · Mumbai",      url: "https://www.zepto.com/careers" },
  { label: "⚡ Razorpay · Data Scientist · Bengaluru",       url: "https://razorpay.com/jobs/" },
  { label: "🚀 CRED · Frontend Architect · Bengaluru",       url: "https://careers.cred.club/" },
  { label: "💼 Swiggy · ML Engineer · Bengaluru",            url: "https://careers.swiggy.com/#/" },
  { label: "🌟 PhonePe · Senior iOS Engineer · Bengaluru",   url: "https://www.phonepe.com/en/careers.html" },
  { label: "🔥 Groww · DevOps Lead · Remote",                url: "https://groww.in/careers" },
  { label: "⚡ Zomato · Product Manager · Gurugram",         url: "https://www.zomato.com/careers" },
  { label: "🚀 Paytm · Backend Engineer · Noida",            url: "https://paytm.com/careers" },
  { label: "💼 Ola · Senior Android Dev · Bengaluru",        url: "https://ola.cars/careers" },
  { label: "🌟 Atlassian · Senior SDE · Remote India",       url: "https://www.atlassian.com/company/careers/all-jobs?location=India" },
];

export function JobsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<Job[]>(FALLBACK_JOBS);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);

  useEffect(() => {
    // Try RemoteOK — no salary shown
    fetch("https://remoteok.com/api?tag=dev")
      .then(r => r.json())
      .then((data: any[]) => {
        const listings = data.slice(1, 15).filter((j: any) => j.company && j.position);
        if (listings.length > 3) {
          const real: Job[] = listings.map((j: any) => ({
            label: `🔥 ${j.company} · ${j.position} · Remote`,
            url: j.url || `https://remoteok.com/remote-jobs`,
          }));
          setJobs([...real, ...FALLBACK_JOBS]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = () => {
      posRef.current -= 0.5;
      if (-posRef.current >= el.scrollWidth / 2) posRef.current = 0;
      el.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [jobs]);

  const items = [...jobs, ...jobs];

  return (
    <div className="w-full bg-primary text-primary-foreground overflow-hidden shrink-0" style={{ height: "36px" }}>
      <div className="flex items-center h-full">
        <div className="flex items-center gap-1.5 px-3 shrink-0 bg-black/20 h-full">
          <Flame className="h-3.5 w-3.5 text-orange-300 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">Hot Jobs</span>
        </div>
        <div className="overflow-hidden flex-1 h-full flex items-center">
          <div ref={trackRef} className="flex whitespace-nowrap" style={{ willChange: "transform" }}>
            {items.map((job, i) => (
              <a
                key={i}
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 text-sm border-r border-white/20 hover:bg-white/15 transition-colors cursor-pointer hover:underline underline-offset-2"
                onMouseEnter={() => cancelAnimationFrame(animRef.current)}
                onMouseLeave={() => {
                  const el = trackRef.current;
                  if (!el) return;
                  const step = () => {
                    posRef.current -= 0.5;
                    if (-posRef.current >= el.scrollWidth / 2) posRef.current = 0;
                    el.style.transform = `translateX(${posRef.current}px)`;
                    animRef.current = requestAnimationFrame(step);
                  };
                  animRef.current = requestAnimationFrame(step);
                }}
              >
                {job.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
