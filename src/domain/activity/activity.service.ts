import { BaseService } from "../../server/core/BaseService";
import { RequestContext } from "../../server/core/RequestContext";
import { db } from "../../server/db";

export class ActivityService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async recordActivity(action: string, entityType: string, entityId: string, details?: any) {
    await db.activityLog.create({
      data: {
        companyId: this.ctx.companyId,
        userId: this.ctx.userId !== "SYSTEM" ? this.ctx.userId : null,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
    this.logInfo(`Activity recorded: ${action} on ${entityType} ${entityId}`);
  }
}
