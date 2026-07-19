export interface Currency {
  code: string;   // ISO 4217, e.g. "USD", "INR"
  symbol: string; // e.g. "$", "₹"
  decimalPlaces: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  date: Date;
}

/**
 * Multi-Currency Conversion helper.
 */
export function convertCurrency(
  amount: bigint,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRate[],
  date: Date
): { amount: bigint; rate: number } {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1.0 };
  }

  // Find exact rate or latest rate before date
  const matchedRate = rates
    .filter(r => r.from === fromCurrency && r.to === toCurrency && new Date(r.date) <= date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!matchedRate) {
    throw new Error(`No exchange rate found from ${fromCurrency} to ${toCurrency} on or before ${date.toDateString()}`);
  }

  const rateMultiplier = BigInt(Math.round(matchedRate.rate * 1000000));
  const converted = (amount * rateMultiplier) / 1000000n;

  return {
    amount: converted,
    rate: matchedRate.rate,
  };
}
