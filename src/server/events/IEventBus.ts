export interface DomainEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly occurredOn: Date;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void;
}
