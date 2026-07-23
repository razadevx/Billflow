import { auth } from "@/server/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = toNextJsHandler(auth.handler);

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error: any) {
    console.error("AUTH GET ERROR:", error);
    return new Response(JSON.stringify({ error: error.message || "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error: any) {
    console.error("AUTH POST ERROR:", error);
    return new Response(JSON.stringify({ error: error.message || "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
