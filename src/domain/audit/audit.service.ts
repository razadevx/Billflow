import { BaseService } from "../../server/core/BaseService";
import { RequestContext } from "../../server/core/RequestContext";
import { db } from "../../server/db";

export class AuditService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async logEvent(event: string, details?: any) {
    await db.auditLog.create({
      data: {
        companyId: this.ctx.companyId,
        userId: this.ctx.userId,
        event,
        ipAddress: this.ctx.ipAddress,
        userAgent: this.ctx.userAgent,
        details: details ? JSON.stringify(details) : null,
      },
    });
    this.logInfo(`Audit log created: ${event}`);
  }
}
