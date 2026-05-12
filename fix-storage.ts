import pg from "pg";
const { Client } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Ensure the resumes bucket exists and is public
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('resumes', 'resumes', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Ensured resumes bucket exists and is public.");

    // Create policy for INSERT
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Insert'
          ) THEN
              CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'resumes');
          END IF;
      END
      $$;
    `);
    console.log("Ensured INSERT policy exists for resumes bucket.");

    // Create policy for SELECT
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Select'
          ) THEN
              CREATE POLICY "Public Select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'resumes');
          END IF;
      END
      $$;
    `);
    console.log("Ensured SELECT policy exists for resumes bucket.");

    // Create policy for UPDATE
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Update'
          ) THEN
              CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'resumes');
          END IF;
      END
      $$;
    `);
    console.log("Ensured UPDATE policy exists for resumes bucket.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();
