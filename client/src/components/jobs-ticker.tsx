import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

interface Job { label: string; url: string; }

const FALLBACK_JOBS: Job[] = [
  { label: "🔥 Google · Staff Engineer · Hyderabad · ₹85L–₹1.2Cr",   url: "https://careers.google.com/jobs/results/?q=engineer&location=India" },
  { label: "⚡ Microsoft · Principal PM · Bengaluru · ₹60L–₹90L",     url: "https://jobs.microsoft.com/en-us/search?lc=India" },
  { label: "🚀 Amazon · SDE-3 · Bengaluru · ₹70L–₹1.1Cr",            url: "https://www.amazon.jobs/en/search?base_query=software+engineer&loc_query=India" },
  { label: "💼 Flipkart · Director Engineering · Bengaluru · ₹1Cr+",  url: "https://www.flipkartcareers.com/#!/joblist" },
  { label: "🌟 Meesho · VP Product · Remote · ₹80L–₹1.2Cr",           url: "https://meesho.io/jobs" },
  { label: "🔥 Zepto · Lead Backend · Mumbai · ₹50L–₹75L",            url: "https://www.zepto.com/careers" },
  { label: "⚡ Razorpay · Data Scientist · Bengaluru · ₹40L–₹70L",    url: "https://razorpay.com/jobs/" },
  { label: "🚀 CRED · Frontend Architect · Bengaluru · ₹55L–₹85L",    url: "https://careers.cred.club/" },
  { label: "💼 Swiggy · ML Engineer · Bengaluru · ₹45L–₹80L",         url: "https://careers.swiggy.com/" },
  { label: "🌟 PhonePe · Senior iOS Dev · Bengaluru · ₹40L–₹65L",     url: "https://www.phonepe.com/en/careers.html" },
  { label: "🔥 Groww · DevOps Lead · Remote · ₹35L–₹55L",             url: "https://groww.in/careers" },
  { label: "⚡ Zomato · Product Manager · Gurugram · ₹30L–₹50L",      url: "https://www.zomato.com/careers" },
];

export function JobsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<Job[]>(FALLBACK_JOBS);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);

  useEffect(() => {
    // Try RemoteOK for real jobs
    fetch("https://remoteok.com/api?tag=dev")
      .then(r => r.json())
      .then((data: any[]) => {
        const listings = data.slice(1, 15).filter((j: any) => j.company && j.position);
        if (listings.length > 3) {
          const real: Job[] = listings.map((j: any) => ({
            label: `🔥 ${j.company} · ${j.position}${j.salary_min ? ` · $${Math.round(j.salary_min/1000)}k` : ""} · Remote`,
            url: j.url || `https://remoteok.com/l/${j.id}`,
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
                className="inline-block px-6 text-sm border-r border-white/20 hover:bg-white/15 transition-colors cursor-pointer underline-offset-2 hover:underline"
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
