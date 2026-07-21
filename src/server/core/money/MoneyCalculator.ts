import { Money } from "./Money";

export class MoneyCalculator {
  static add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) throw new Error("Currency mismatch");
    return Money.fromNumber(a.amount + b.amount, a.currency);
  }

  static subtract(a: Money, b: Money): Money {
    if (a.currency !== b.currency) throw new Error("Currency mismatch");
    return Money.fromNumber(a.amount - b.amount, a.currency);
  }

  static multiply(money: Money, multiplier: number): Money {
    return Money.fromNumber(money.amount * multiplier, money.currency);
  }

  static divide(money: Money, divisor: number): Money {
    if (divisor === 0) throw new Error("Cannot divide by zero");
    return Money.fromNumber(money.amount / divisor, money.currency);
  }
}
