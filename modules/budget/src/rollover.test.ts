import { describe, it, expect } from 'vitest';
import { calculateRollover, processMonthlyRollover, RolloverInput } from './rollover.js';

describe('Budget Rollover Engine', () => {
  it('should compute rollover correctly based on none/carry/recover modes', () => {
    // Mode: none (discards surplus)
    const inputNone: RolloverInput = {
      categoryId: 'none-cat',
      assigned: 50000n,    // ₹500
      spent: 20000n,       // spent ₹200
      rolloverIn: 10000n,  // rolled in ₹100
      rolloverMode: 'none',
    };
    const outNone = calculateRollover(inputNone, 30000n);
    expect(outNone.closingBalance).toBe(40000n); // 500 + 100 - 200 = 400
    expect(outNone.rolloverOut).toBe(0n);        // Mode: none carries over 0
    expect(outNone.nextMonthStartingBalance).toBe(30000n); // 30000 assigned + 0 rollover = 30000

    // Mode: carry (carries surplus, drops deficit)
    const inputCarryPositive: RolloverInput = {
      categoryId: 'carry-positive',
      assigned: 50000n,
      spent: 30000n,
      rolloverIn: 10000n,
      rolloverMode: 'carry',
    };
    const outCarryPositive = calculateRollover(inputCarryPositive, 30000n);
    expect(outCarryPositive.closingBalance).toBe(30000n); // 500 + 100 - 300 = 300
    expect(outCarryPositive.rolloverOut).toBe(30000n);
    expect(outCarryPositive.nextMonthStartingBalance).toBe(60000n); // 30000 assigned + 30000 = 60000

    const inputCarryNegative: RolloverInput = {
      categoryId: 'carry-negative',
      assigned: 50000n,
      spent: 70000n, // spent ₹700 (overspent)
      rolloverIn: 10000n,
      rolloverMode: 'carry',
    };
    const outCarryNegative = calculateRollover(inputCarryNegative, 30000n);
    expect(outCarryNegative.closingBalance).toBe(-10000n); // deficit of ₹100
    expect(outCarryNegative.rolloverOut).toBe(0n);         // carry drops negative deficits
    expect(outCarryNegative.nextMonthStartingBalance).toBe(30000n);

    // Mode: recover (carries both surplus and deficit)
    const inputRecoverNegative: RolloverInput = {
      categoryId: 'recover-negative',
      assigned: 50000n,
      spent: 70000n,
      rolloverIn: 10000n,
      rolloverMode: 'recover',
    };
    const outRecoverNegative = calculateRollover(inputRecoverNegative, 30000n);
    expect(outRecoverNegative.closingBalance).toBe(-10000n);
    expect(outRecoverNegative.rolloverOut).toBe(-10000n); // recover carries deficit over!
    expect(outRecoverNegative.nextMonthStartingBalance).toBe(20000n); // 30000 assigned - 10000 = 20000
  });
});
