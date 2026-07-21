import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid URL"),
  BETTER_AUTH_SECRET: z.string().min(32, "Must be at least 32 characters long"),
  SUPABASE_URL: z.string().url("Must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  SUPABASE_SERVICE_KEY: z.string().min(1, "Supabase Service Key is required").optional(),
});

// We only validate server-side environment variables if we are on the server
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
};

let env = processEnv as z.infer<typeof envSchema>;

if (typeof window === "undefined") {
  const parsed = envSchema.safeParse(processEnv);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  
  env = parsed.data;
}

export { env };
