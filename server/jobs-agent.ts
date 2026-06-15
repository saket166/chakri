import { db } from "./db";
import { users } from "@shared/schema";
import { isNotNull } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

const JOBS_DB_FILE = path.join(process.cwd(), "server", "jobs_db.json");

export async function getJobsDb() {
  try {
    const data = await fs.readFile(JOBS_DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e: any) {
    if (e.code === "ENOENT") {
      await fs.writeFile(JOBS_DB_FILE, JSON.stringify([]));
      return [];
    }
    throw e;
  }
}

export async function saveJobsDb(jobs: any[]) {
  await fs.writeFile(JOBS_DB_FILE, JSON.stringify(jobs, null, 2));
}

// Ensure the jobs DB exists on startup
getJobsDb().catch(console.error);

export async function runJobScraperAgent() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  // 1. Get all unique companies present on Chakri
  const allUsers = await db.select({ company: users.company }).from(users).where(isNotNull(users.company));
  
  // Extract distinct companies, filter out empty/null
  const rawCompanies = allUsers.map(u => u.company?.trim()).filter(Boolean) as string[];
  const distinctCompanies = [...new Set(rawCompanies)];

  if (distinctCompanies.length === 0) {
    console.log("[JobAgent] No companies found in database.");
    return { addedCount: 0, newJobs: [] };
  }

  console.log(`[JobAgent] Triggering agent for ${distinctCompanies.length} companies...`);

  // We will batch companies into small groups to avoid giant prompts
  const batchSize = 5;
  let allFoundJobs: any[] = [];

  for (let i = 0; i < distinctCompanies.length; i += batchSize) {
    const companyBatch = distinctCompanies.slice(i, i + batchSize);
    
    // We use the Gemini API via fetch to ensure no dependency issues.
    // We enable Google Search grounding so the agent can look up current job openings!
    const prompt = `
      You are an expert technical recruiter and web scraper agent.
      Your task is to find active job openings for the following companies: ${companyBatch.join(", ")}.

      STRICT CRITERIA:
      1. Location MUST be in India.
      2. Experience required MUST be strictly between 3 to 10 years.
      3. Role MUST be exactly one of: "Software Engineer", "Data Engineer", or "Data Scientist" (or a direct equivalent like "Senior Software Engineer").
      
      If you cannot find a job matching these criteria for a specific company, skip that company. DO NOT invent jobs.
      
      Respond ONLY with a valid JSON array of objects. Do not use markdown wrapping like \`\`\`json.
      Format:
      [
        {
          "id": "generate_a_random_id",
          "companyName": "Company Name",
          "roleTitle": "Exact Role Title",
          "jobLink": "URL to the career page or job listing",
          "category": "Software Engineer" | "Data Engineer" | "Data Scientist",
          "experienceRange": "3-10 years",
          "requiredSkills": "List of 3-4 key skills",
          "postedAt": "ISO date string for today"
        }
      ]
    `;

    try {
      console.log(`[JobAgent] Asking Gemini to search for batch: ${companyBatch.join(", ")}`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2,
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[JobAgent] Gemini API Error:`, errText);
        continue; // Skip this batch on error
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      
      // Clean up markdown if the LLM hallucinated it despite instructions
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedJobs = JSON.parse(cleanJson);
      
      if (Array.isArray(parsedJobs)) {
        allFoundJobs.push(...parsedJobs);
      }
    } catch (e) {
      console.error(`[JobAgent] Error parsing batch ${companyBatch.join(", ")}:`, e);
    }
    
    // Wait slightly to respect rate limits
    await new Promise(res => setTimeout(res, 2000));
  }

  // Save the successfully scraped jobs to our JSON db
  const existingJobs = await getJobsDb();
  
  // Optional: We can merge, but for this MVP, we'll just prepend them so new jobs are at the top.
  // We'll also deduplicate by URL just in case.
  const existingUrls = new Set(existingJobs.map((j: any) => j.jobLink));
  const newUniqueJobs = allFoundJobs.filter(j => !existingUrls.has(j.jobLink));

  const updatedDb = [...newUniqueJobs, ...existingJobs];
  
  // Keep the DB from growing infinitely large (e.g., max 300 jobs)
  await saveJobsDb(updatedDb.slice(0, 300));

  console.log(`[JobAgent] Completed. Added ${newUniqueJobs.length} new jobs.`);
  return { addedCount: newUniqueJobs.length, newJobs: newUniqueJobs };
}
