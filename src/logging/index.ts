export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: any;
}

export class PlatformLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 500;

  public static log(level: LogLevel, source: string, message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const consoleFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
    consoleFn(`[${entry.timestamp}] [${level}] [${source}] ${message}`, details || "");
  }

  public static debug(source: string, message: string, details?: any): void {
    this.log("DEBUG", source, message, details);
  }

  public static info(source: string, message: string, details?: any): void {
    this.log("INFO", source, message, details);
  }

  public static warn(source: string, message: string, details?: any): void {
    this.log("WARN", source, message, details);
  }

  public static error(source: string, message: string, details?: any): void {
    this.log("ERROR", source, message, details);
  }

  public static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public static clear(): void {
    this.logs = [];
  }
}
