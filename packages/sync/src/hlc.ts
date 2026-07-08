export class HLC {
  public ts: number;     // Physical wall-clock time (ms)
  public count: number;  // Logical tick counter
  public node: string;   // Unique client identifier (e.g. device ID)

  constructor(ts: number, count: number, node: string) {
    this.ts = ts;
    this.count = count;
    this.node = node;
  }

  /**
   * Generates a new HLC instance incremented from local physical time.
   */
  public static increment(localHlc: HLC, nowMs: number): HLC {
    const nextTs = Math.max(localHlc.ts, nowMs);
    let nextCount = 0;

    if (nextTs === localHlc.ts) {
      nextCount = localHlc.count + 1;
    }

    return new HLC(nextTs, nextCount, localHlc.node);
  }

  /**
   * Updates local HLC upon receiving a remote message clock tick.
   */
  public static receive(localHlc: HLC, remoteHlc: HLC, nowMs: number): HLC {
    const nextTs = Math.max(localHlc.ts, remoteHlc.ts, nowMs);
    let nextCount = 0;

    if (nextTs === localHlc.ts && nextTs === remoteHlc.ts) {
      nextCount = Math.max(localHlc.count, remoteHlc.count) + 1;
    } else if (nextTs === localHlc.ts) {
      nextCount = localHlc.count + 1;
    } else if (nextTs === remoteHlc.ts) {
      nextCount = remoteHlc.count + 1;
    }

    return new HLC(nextTs, nextCount, localHlc.node);
  }

  /**
   * Packs the HLC to string.
   */
  public toString(): string {
    return `${this.ts.toString().padStart(15, '0')}:${this.count.toString().padStart(5, '0')}:${this.node}`;
  }

  /**
   * Unpacks a string formatted representation to HLC.
   */
  public static parse(hlcString: string): HLC {
    const parts = hlcString.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid HLC format: ${hlcString}`);
    }
    return new HLC(parseInt(parts[0], 10), parseInt(parts[1], 10), parts[2]);
  }

  /**
   * Compares two HLC clocks. Returns negative if a < b, positive if a > b, 0 if equal.
   */
  public static compare(a: HLC, b: HLC): number {
    if (a.ts !== b.ts) {
      return a.ts - b.ts;
    }
    if (a.count !== b.count) {
      return a.count - b.count;
    }
    return a.node.localeCompare(b.node);
  }
}
