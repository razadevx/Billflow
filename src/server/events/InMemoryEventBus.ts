import { DomainEvent, IEventBus } from "./IEventBus";
import { logger } from "../logger";

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, Array<(event: any) => Promise<void>>> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    logger.debug(`Publishing event: ${event.type}`, { payload: event.payload });
    
    const eventHandlers = this.handlers.get(event.type) || [];
    
    // Execute all handlers concurrently without blocking the main thread
    Promise.allSettled(
      eventHandlers.map((handler) => handler(event))
    ).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          logger.error(`Error handling event ${event.type}`, result.reason);
        }
      });
    });
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    const existingHandlers = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existingHandlers, handler]);
    logger.debug(`Subscribed to event: ${eventType}`);
  }
}

// Global instance for the application
export const eventBus: IEventBus = new InMemoryEventBus();
