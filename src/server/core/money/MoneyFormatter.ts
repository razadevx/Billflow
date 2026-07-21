import { Money } from "./Money";

export class MoneyFormatter {
  static format(money: Money, locale: string = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currency,
    }).format(money.amount);
  }

  static formatNumber(amount: number, currency: string = "USD", locale: string = "en-US"): string {
    return this.format(Money.fromNumber(amount, currency), locale);
  }
}
