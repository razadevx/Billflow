type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? JSON.stringify(meta) : "";
    
    // For now, log to console. This can be swapped with Pino, Winston, Axiom, or Sentry later.
    console[level](`[${timestamp}] [${level.toUpperCase()}]: ${message} ${formattedMeta}`);
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  }

  info(message: string, meta?: any) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: any) {
    this.log("error", message, meta);
  }
}

export const logger = new Logger();
