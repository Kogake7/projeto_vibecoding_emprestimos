import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

// Lazy until the first server operation, so the public setup page builds without secrets.
export function getServerEnv() {
  return schema.parse(process.env);
}
