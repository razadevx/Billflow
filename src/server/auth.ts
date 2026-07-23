import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { env } from "./env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", 
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://billflow.xinrlabs.com",
  trustedOrigins: [
    "https://billflow.xinrlabs.com",
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      console.log(`\n\n\n=== PASSWORD RESET ===\nUser: ${user.email}\nReset Link: ${url}\n======================\n\n\n`);
    },
  },
  user: {
    additionalFields: {
      companyId: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "STAFF"
      }
    }
  }
});
