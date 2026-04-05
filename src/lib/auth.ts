import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "./db";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const db = getDb();

export const auth = betterAuth({
  database: db,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  pages: {
    error: "/auth/error",
  },
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
            return false;
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const row = db
            .prepare("SELECT email FROM user WHERE id = ?")
            .get(session.userId) as { email: string } | undefined;
          if (!row || !ALLOWED_EMAILS.includes(row.email.toLowerCase())) {
            return false;
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
