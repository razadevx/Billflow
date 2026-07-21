import { Role } from "@prisma/client";

export interface RequestContext {
  userId: string;
  companyId: string;
  role: Role;
  permissions: string[];
  
  requestId: string;
  timestamp: Date;
  
  timezone?: string;
  locale?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export const createSystemContext = (companyId: string): RequestContext => {
  return {
    userId: "SYSTEM",
    companyId,
    role: "ADMIN",
    permissions: ["manage"],
    requestId: `SYS-${Date.now()}`,
    timestamp: new Date(),
  };
};
