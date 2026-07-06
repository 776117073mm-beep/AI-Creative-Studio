export class DiagnosticsCollector {
  private static pingTimes: number[] = [];

  public static recordLatency(ms: number): void {
    this.pingTimes.push(ms);
    if (this.pingTimes.length > 50) {
      this.pingTimes.shift();
    }
  }

  public static getAverageLatency(): number {
    if (this.pingTimes.length === 0) return 12; // default mock ping
    const sum = this.pingTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.pingTimes.length);
  }

  public static getHardwareThermalProfile(): { fansSpeedRpm: number; throttlingLevel: string } {
    return {
      fansSpeedRpm: 3400,
      throttlingLevel: "0% (Optimal Core)"
    };
  }
}
export {};
