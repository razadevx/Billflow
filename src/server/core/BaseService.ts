import { RequestContext } from "./RequestContext";
import { logger } from "../logger";

export abstract class BaseService {
  constructor(protected readonly ctx: RequestContext) {}

  protected logInfo(message: string, meta?: any) {
    logger.info(message, {
      requestId: this.ctx.requestId,
      userId: this.ctx.userId,
      companyId: this.ctx.companyId,
      ...meta,
    });
  }

  protected logError(message: string, error: any, meta?: any) {
    logger.error(message, {
      requestId: this.ctx.requestId,
      userId: this.ctx.userId,
      companyId: this.ctx.companyId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
    });
  }

  protected hasPermission(permission: string): boolean {
    return (
      this.ctx.permissions.includes("manage") ||
      this.ctx.permissions.includes(permission)
    );
  }

  protected requirePermission(permission: string) {
    if (!this.hasPermission(permission)) {
      this.logError(`Permission denied: missing ${permission}`, new Error("Forbidden"));
      throw new Error("Forbidden: Missing required permission");
    }
  }
}
