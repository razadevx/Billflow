export class Money {
  constructor(public readonly amount: number, public readonly currency: string = "USD") {}

  static zero(currency: string = "USD"): Money {
    return new Money(0, currency);
  }

  static fromNumber(amount: number, currency: string = "USD"): Money {
    // Basic rounding to 2 decimal places to prevent float drift
    const rounded = Math.round(amount * 100) / 100;
    return new Money(rounded, currency);
  }

  toNumber(): number {
    return this.amount;
  }
}
