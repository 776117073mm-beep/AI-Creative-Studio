export interface ExpressionContext {
  time: number;
  frame: number;
  value: number;
  index: number;
  fps: number;
  layerName: string;
  getPropertyValue: (layerName: string, propertyName: string) => number;
}

export class ExpressionEngine {
  private static instance: ExpressionEngine | null = null;
  private errorLog: string[] = [];

  public static getInstance(): ExpressionEngine {
    if (!ExpressionEngine.instance) {
      ExpressionEngine.instance = new ExpressionEngine();
    }
    return ExpressionEngine.instance;
  }

  /**
   * REALS-TIME EXPRESSION RUNTIME EVALUATOR
   * Evaluates expressions dynamically inside a safe try-catch wrapper.
   */
  public evaluateExpression(
    expressionString: string,
    context: ExpressionContext
  ): number {
    try {
      const sanitized = this.sanitizeExpression(expressionString);
      if (!sanitized) return context.value;

      // Build standard helper functions injected into expression scope
      const wiggle = (freq: number, amp: number): number => {
        // Procedural sinusoidal noise offset for wiggle evaluations
        const wave = Math.sin(context.frame * freq * 0.1) * Math.cos(context.frame * freq * 0.07);
        return context.value + wave * amp;
      };

      const loopOut = (type = "cycle"): number => {
        // Mock timeline loop wrap values
        return context.value;
      };

      // Helper to link other layers/properties: e.g., thisComp.layer("Logo").transform.position
      const thisComp = {
        layer: (name: string) => ({
          transform: {
            property: (propName: string) => context.getPropertyValue(name, propName)
          }
        })
      };

      // Math functions aliases for ease of use in simple scripts
      const sin = (v: number) => Math.sin(v);
      const cos = (v: number) => Math.cos(v);
      const tan = (v: number) => Math.tan(v);
      const PI = Math.PI;

      // Extract context variables
      const { time, frame, value, index, fps } = context;

      // Standard sandbox execution via dynamic Function construction.
      // We pass in all context properties as local variables.
      const evaluator = new Function(
        "time", "frame", "value", "index", "fps", "wiggle", "loopOut", "thisComp", "sin", "cos", "tan", "PI", "Math",
        `try {
          return (${sanitized});
        } catch (e) {
          return value;
        }`
      );

      const result = evaluator(
        time,
        frame,
        value,
        index,
        fps,
        wiggle,
        loopOut,
        thisComp,
        sin,
        cos,
        tan,
        PI,
        Math
      );

      const numVal = Number(result);
      return isNaN(numVal) ? context.value : numVal;
    } catch (err: any) {
      this.logError(`Expression Evaluation Error in layer "${context.layerName}": ${err?.message || err}`);
      return context.value; // Clean error recovery fallback
    }
  }

  /**
   * FILTER EXPRESSION INPUTS TO PREVENT THREAD ATTACKS OR SYNTAX INTRUSIONS
   */
  private sanitizeExpression(expr: string): string {
    let cleaned = expr.trim();
    // Remove trailing semicolons or commands that could break expression statement returns
    if (cleaned.endsWith(";")) {
      cleaned = cleaned.slice(0, -1);
    }

    // Block hazardous Node or window-level runtime commands (Sandbox safety)
    const dangerousTokens = ["window", "document", "process", "require", "import", "fetch", "eval", "global", "cookie"];
    for (const token of dangerousTokens) {
      if (cleaned.toLowerCase().includes(token)) {
        this.logError(`Expression violation: blocked dangerous word "${token}"`);
        return "";
      }
    }

    return cleaned;
  }

  private logError(msg: string): void {
    console.warn(`[ExpressionEngine] ${msg}`);
    this.errorLog.push(`${new Date().toLocaleTimeString()}: ${msg}`);
    if (this.errorLog.length > 50) this.errorLog.shift();
  }

  public getErrors(): string[] {
    return this.errorLog;
  }

  public clearErrors(): void {
    this.errorLog = [];
  }
}
