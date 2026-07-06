export interface SubtitleCue {
  id: string;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  settings?: {
    align?: "start" | "center" | "end" | "left" | "right";
    vertical?: "rl" | "lr" | "";
    line?: number | string;
    position?: number | string;
    size?: number | string;
  };
}

export interface SubtitleMetadata {
  format: string;
  language: string;
  cueCount: number;
  totalDurationSec: number;
  author?: string;
}

export interface SubtitleParserPlugin {
  formatId: string;
  extensions: string[];
  parse(content: string): SubtitleCue[];
  stringify(cues: SubtitleCue[]): string;
}

export class SubtitleEngine {
  private static instance: SubtitleEngine;
  private parsers: Map<string, SubtitleParserPlugin> = new Map();
  private activeCues: SubtitleCue[] = [];
  private activeMetadata: SubtitleMetadata | null = null;

  private constructor() {
    this.registerDefaultParsers();
  }

  public static getInstance(): SubtitleEngine {
    if (!SubtitleEngine.instance) {
      SubtitleEngine.instance = new SubtitleEngine();
    }
    return SubtitleEngine.instance;
  }

  /**
   * Register a custom subtitle format parser/writer plugin
   */
  public registerParser(plugin: SubtitleParserPlugin): void {
    this.parsers.set(plugin.formatId, plugin);
    console.log(`[SubtitleEngine] Registered parser plugin for subtitle format: ${plugin.formatId}`);
  }

  /**
   * Import Subtitles from File Contents
   */
  public async importSubtitles(content: string, format: string, language = "en"): Promise<{ cues: SubtitleCue[]; metadata: SubtitleMetadata }> {
    const parser = this.parsers.get(format.toLowerCase());
    if (!parser) {
      throw new Error(`[SubtitleEngine] Unsupported subtitle format for parser: ${format}`);
    }

    try {
      const cues = parser.parse(content);
      const totalDurationSec = cues.length > 0 ? Math.max(...cues.map(c => c.endTimeSec)) : 0;

      const metadata: SubtitleMetadata = {
        format,
        language,
        cueCount: cues.length,
        totalDurationSec
      };

      this.activeCues = cues;
      this.activeMetadata = metadata;

      console.log(`[SubtitleEngine] Imported subtitle file with ${cues.length} cues, total duration: ${totalDurationSec.toFixed(2)}s`);
      return { cues, metadata };
    } catch (err: any) {
      throw new Error(`[SubtitleEngine] Parsing failed: ${err.message}`);
    }
  }

  /**
   * Export Subtitles as string
   */
  public exportSubtitles(format: string): string {
    const parser = this.parsers.get(format.toLowerCase());
    if (!parser) {
      throw new Error(`[SubtitleEngine] Unsupported subtitle format for exporter: ${format}`);
    }
    return parser.stringify(this.activeCues);
  }

  /**
   * Get Active cues list
   */
  public getActiveCues(): SubtitleCue[] {
    return [...this.activeCues];
  }

  /**
   * Set dynamic list of cues directly
   */
  public setActiveCues(cues: SubtitleCue[], format = "custom-timeline"): void {
    this.activeCues = cues;
    this.activeMetadata = {
      format,
      language: "en",
      cueCount: cues.length,
      totalDurationSec: cues.length > 0 ? Math.max(...cues.map(c => c.endTimeSec)) : 0
    };
  }

  /**
   * Find matching subtitle cue at a specific playhead time (seconds)
   */
  public getCueAtTime(timeSec: number): SubtitleCue[] {
    return this.activeCues.filter(cue => timeSec >= cue.startTimeSec && timeSec <= cue.endTimeSec);
  }

  /**
   * Synchronize cue offsets by shifting timestamps
   */
  public shiftTimeline(offsetSeconds: number): void {
    this.activeCues = this.activeCues.map(cue => ({
      ...cue,
      startTimeSec: Math.max(0, cue.startTimeSec + offsetSeconds),
      endTimeSec: Math.max(0, cue.endTimeSec + offsetSeconds)
    }));
    console.log(`[SubtitleEngine] Shifted timeline by ${offsetSeconds}s`);
  }

  /**
   * Parse helper for standard time signatures
   * SRT: 00:01:20,123 -> WebVTT: 00:01:20.123
   */
  public parseTimeCode(timecode: string): number {
    const cleaned = timecode.trim().replace(",", ".");
    const parts = cleaned.split(":");
    if (parts.length < 2) return 0;

    let hours = 0;
    let minutes = 0;
    let secondsWithMs = 0;

    if (parts.length === 3) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      secondsWithMs = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      minutes = parseInt(parts[0], 10);
      secondsWithMs = parseFloat(parts[1]);
    }

    return (hours * 3600) + (minutes * 60) + secondsWithMs;
  }

  /**
   * Format helper to time string
   * formatTimeCode(80.123, "vtt") -> "00:01:20.123"
   */
  public formatTimeCode(timeSec: number, format: "vtt" | "srt"): string {
    const hrs = Math.floor(timeSec / 3600);
    const mins = Math.floor((timeSec % 3600) / 60);
    const secs = Math.floor(timeSec % 60);
    const ms = Math.floor((timeSec % 1) * 1000);

    const pad = (num: number, size = 2) => num.toString().padStart(size, "0");

    const sep = format === "srt" ? "," : ".";
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${sep}${pad(ms, 3)}`;
  }

  /**
   * Initialize native SubRip and WebVTT parsers
   */
  private registerDefaultParsers(): void {
    // 1. SRT Parser
    this.registerParser({
      formatId: "srt",
      extensions: ["srt"],
      parse: (content: string): SubtitleCue[] => {
        const cues: SubtitleCue[] = [];
        const blocks = content.split(/\r?\n\r?\n/);

        blocks.forEach((block, idx) => {
          const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 3) return;

          // Expect:
          // Line 0: Index ID
          // Line 1: Timecodes: 00:01:02,000 --> 00:01:05,000
          // Line 2+: Subtitle payload
          const id = lines[0];
          const timeLine = lines[1];
          if (!timeLine.includes("-->")) return;

          const [startStr, endStr] = timeLine.split("-->").map(s => s.trim());
          const startTimeSec = this.parseTimeCode(startStr);
          const endTimeSec = this.parseTimeCode(endStr);
          const text = lines.slice(2).join("\n");

          cues.push({ id, startTimeSec, endTimeSec, text });
        });

        return cues;
      },
      stringify: (cues: SubtitleCue[]): string => {
        return cues.map((cue, idx) => {
          const startStr = this.formatTimeCode(cue.startTimeSec, "srt");
          const endStr = this.formatTimeCode(cue.endTimeSec, "srt");
          return `${idx + 1}\n${startStr} --> ${endStr}\n${cue.text}\n`;
        }).join("\n");
      }
    });

    // 2. WebVTT Parser
    this.registerParser({
      formatId: "vtt",
      extensions: ["vtt"],
      parse: (content: string): SubtitleCue[] => {
        const cues: SubtitleCue[] = [];
        const normalized = content.replace(/^\uFEFF/, ""); // strip BOM
        const lines = normalized.split(/\r?\n/).map(l => l.trim());

        if (!lines[0].startsWith("WEBVTT")) {
          throw new Error("Invalid WebVTT Signature header.");
        }

        let currentCueId = 1;
        let index = 1;

        while (index < lines.length) {
          const line = lines[index];
          if (!line) {
            index++;
            continue;
          }

          // Check if line contains timestamp separator -->
          if (line.includes("-->")) {
            const [startStr, endStr] = line.split("-->").map(s => s.trim());
            
            // Check settings (e.g. vertical:rl align:center)
            const endParts = endStr.split(/\s+/);
            const cleanEndStr = endParts[0];
            const settingsStr = endParts.slice(1).join(" ");

            const startTimeSec = this.parseTimeCode(startStr);
            const endTimeSec = this.parseTimeCode(cleanEndStr);

            // Read text until empty line
            const textLines: string[] = [];
            index++;
            while (index < lines.length && lines[index] !== "") {
              textLines.push(lines[index]);
              index++;
            }

            const text = textLines.join("\n");
            const cueId = (currentCueId++).toString();

            cues.push({
              id: cueId,
              startTimeSec,
              endTimeSec,
              text,
              settings: this.parseVttSettings(settingsStr)
            });
          } else {
            // Might be ID line or metadata block
            index++;
          }
        }

        return cues;
      },
      stringify: (cues: SubtitleCue[]): string => {
        let out = "WEBVTT\n\n";
        cues.forEach((cue) => {
          const startStr = this.formatTimeCode(cue.startTimeSec, "vtt");
          const endStr = this.formatTimeCode(cue.endTimeSec, "vtt");
          
          let settingsStr = "";
          if (cue.settings) {
            if (cue.settings.align) settingsStr += ` align:${cue.settings.align}`;
            if (cue.settings.vertical) settingsStr += ` vertical:${cue.settings.vertical}`;
            if (cue.settings.line) settingsStr += ` line:${cue.settings.line}`;
            if (cue.settings.position) settingsStr += ` position:${cue.settings.position}`;
            if (cue.settings.size) settingsStr += ` size:${cue.settings.size}`;
          }

          out += `${startStr} --> ${endStr}${settingsStr}\n${cue.text}\n\n`;
        });
        return out;
      }
    });
  }

  private parseVttSettings(settingsStr: string): any {
    if (!settingsStr) return undefined;
    const settings: any = {};
    const parts = settingsStr.split(/\s+/);

    parts.forEach(part => {
      const [key, value] = part.split(":");
      if (key === "align") {
        settings.align = value;
      } else if (key === "vertical") {
        settings.vertical = value;
      } else if (key === "line") {
        settings.line = isNaN(Number(value)) ? value : Number(value);
      } else if (key === "position") {
        settings.position = isNaN(Number(value)) ? value : Number(value);
      } else if (key === "size") {
        settings.size = isNaN(Number(value)) ? value : Number(value);
      }
    });

    return settings;
  }
}
