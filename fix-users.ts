import { db } from "./server/db";
import { users } from "./shared/schema";

async function main() {
  console.log("Updating existing users to onboarded = true...");
  const result = await db.update(users).set({ onboarded: true });
  console.log("Done!", result);
  process.exit(0);
}

main().catch(console.error);
