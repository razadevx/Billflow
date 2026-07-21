import { auth } from "@/server/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
