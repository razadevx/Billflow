import { logger } from "../logger";

export interface Job {
  name: string;
  cron: string;
  handler: () => Promise<void>;
}

export class Scheduler {
  private jobs: Job[] = [];

  register(job: Job) {
    this.jobs.push(job);
    logger.info(`Job registered: ${job.name} with schedule ${job.cron}`);
  }

  // In production, this would integrate with BullMQ, Trigger.dev, or Node Cron
  start() {
    logger.info("Scheduler started.");
    // Mock runner
  }
}

export const scheduler = new Scheduler();
