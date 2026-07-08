/**
 * Utility functions for Richingness Platform.
 */

/**
 * Formats a BigInt representing paise into a standard decimal string (e.g. ₹100.50).
 */
export function formatPaiseToRupees(paise: bigint): string {
  const isNegative = paise < 0n;
  const absolutePaise = isNegative ? -paise : paise;
  const rupees = absolutePaise / 100n;
  const cents = absolutePaise % 100n;
  const paddedCents = cents.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${rupees}.${paddedCents}`;
}

/**
 * Converts a standard decimal currency string to paise BigInt.
 */
export function formatRupeesToPaise(rupees: string): bigint {
  const trimmed = rupees.trim();
  const parts = trimmed.split('.');
  
  if (parts.length > 2) {
    throw new Error('Invalid decimal format');
  }
  
  const wholePart = BigInt(parts[0] || '0');
  const decimalPartString = (parts[1] || '0').substring(0, 2).padEnd(2, '0');
  const decimalPart = BigInt(decimalPartString);
  
  return wholePart * 100n + (wholePart < 0n ? -decimalPart : decimalPart);
}

/**
 * Deep freezes an object to enforce immutability rules.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Reflect.ownKeys(obj);
  for (const name of propNames) {
    const value = obj[name as keyof T];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}
