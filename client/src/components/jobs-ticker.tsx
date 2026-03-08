import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";

// Static fallback jobs (India-focused)
const FALLBACK_JOBS = [
  "🔥 Google · Staff Engineer · Hyderabad · ₹85L–₹1.2Cr",
  "⚡ Microsoft · Principal PM · Bengaluru · ₹60L–₹90L",
  "🚀 Amazon · SDE-3 · Bengaluru · ₹70L–₹1.1Cr",
  "💼 Flipkart · Director Engineering · Bengaluru · ₹1Cr+",
  "🌟 Meesho · VP Product · Remote · ₹80L–₹1.2Cr",
  "🔥 Zepto · Lead Backend · Mumbai · ₹50L–₹75L",
  "⚡ Razorpay · Data Scientist · Bengaluru · ₹40L–₹70L",
  "🚀 CRED · Frontend Architect · Bengaluru · ₹55L–₹85L",
  "💼 Swiggy · ML Engineer · Bengaluru · ₹45L–₹80L",
  "🌟 PhonePe · Senior iOS Dev · Bengaluru · ₹40L–₹65L",
  "🔥 Groww · DevOps Lead · Remote · ₹35L–₹55L",
  "⚡ Zomato · Product Manager · Gurugram · ₹30L–₹50L",
];

export function JobsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState<string[]>(FALLBACK_JOBS);

  // Try to fetch real jobs from a public API (Adzuna free tier via RapidAPI style proxy, or just use remoteok)
  useEffect(() => {
    // We fetch from RemoteOK which has a CORS-friendly JSON endpoint — no API key needed
    fetch("https://remoteok.com/api?tag=dev", {
      headers: { "User-Agent": "ChakrApp/1.0" },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        // First item is metadata, skip it
        const listings = data.slice(1, 20).filter((j) => j.company && j.position);
        if (listings.length > 3) {
          const formatted = listings.map((j: any) => {
            const salary = j.salary_min ? ` · $${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k` : "";
            return `🔥 ${j.company} · ${j.position}${salary} · Remote`;
          });
          setJobs([...formatted, ...FALLBACK_JOBS]);
        }
      })
      .catch(() => {
        // Silently fall back to static list — no error shown to user
      });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let pos = 0;
    let animId: number;
    const step = () => {
      pos -= 0.6;
      if (-pos >= el.scrollWidth / 2) pos = 0;
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
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
              <span key={i} className="inline-block px-6 text-sm border-r border-white/20 cursor-pointer hover:bg-white/10 transition-colors">
                {job}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
