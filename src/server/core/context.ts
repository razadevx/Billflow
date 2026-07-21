import { headers } from "next/headers";
import { auth } from "../auth";
import { db } from "../db";
import { RequestContext } from "./RequestContext";
import { getPermissionsArray } from "../permissions";
import { CurrentCompanyService } from "../services/CurrentCompanyService";

export async function getRequestContext(): Promise<RequestContext | null> {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.session || !sessionData?.user) {
    return null;
  }

  // Fetch the full user from our database to get their default role
  const user = await db.user.findUnique({
    where: { id: sessionData.user.id },
    select: { role: true },
  });

  if (!user) {
    return null;
  }

  // Resolve active company via the CurrentCompanyService
  const companyId = await CurrentCompanyService.resolveActiveCompanyId(sessionData.user.id);
  if (!companyId) {
    return null;
  }

  const permissions = getPermissionsArray(user.role);

  // In Next.js, getting IP and UA from headers can be tricky but let's try standard ones
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined;
  const userAgent = headersList.get("user-agent") || undefined;
  
  // Note: timezone and locale could be passed via headers if the frontend sends them,
  // or they could be loaded from User preferences. We'll leave them as optional for now.

  return {
    userId: sessionData.user.id,
    companyId,
    role: user.role,
    permissions,
    requestId: crypto.randomUUID(),
    timestamp: new Date(),
    sessionId: sessionData.session.id,
    ipAddress,
    userAgent,
    timezone: "UTC", // Defaulting for now
    locale: "en-US", // Defaulting for now
  };
}
