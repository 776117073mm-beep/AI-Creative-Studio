import { IAiTask } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export interface IParsedResult {
  intent: string;
  entities: Record<string, any>;
  tasks: IAiTask[];
  language: string;
  isMultiStep: boolean;
  confidence: number;
  followUpQuestions: string[];
}

export class PromptParser {
  private static instance: PromptParser;

  private constructor() {}

  public static getInstance(): PromptParser {
    if (!PromptParser.instance) {
      PromptParser.instance = new PromptParser();
    }
    return PromptParser.instance;
  }

  /**
   * Main entry point to parse a natural language prompt into a structured set of tasks.
   */
  public async parse(prompt: string, previousContext: string[] = []): Promise<IParsedResult> {
    const language = this.detectLanguage(prompt);
    
    // Check if we can use server-side Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await this.parseWithGemini(prompt, previousContext);
        if (result) return result;
      } catch (err) {
        console.warn("[PromptParser] Gemini parsing failed, falling back to local cognitive engine:", err);
      }
    }

    // Heuristic/Cognitive Offline Engine
    return this.parseOffline(prompt, language, previousContext);
  }

  /**
   * Uses Gemini API for top-tier prompt parsing and structured JSON extraction
   */
  private async parseWithGemini(prompt: string, previousContext: string[]): Promise<IParsedResult | null> {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse the following video/audio editing prompt: "${prompt}". Context: [${previousContext.join(", ")}]`,
      config: {
        systemInstruction: `You are the master AI Prompt Parser of AI Creative Studio. Your goal is to dissect a user creative instruction into structured JSON output.
The output MUST fit this schema:
{
  "intent": string (e.g. "color_grading", "audio_restoration", "subtitle_translation", "vfx_addition", "video_processing", "complex"),
  "entities": { [key: string]: any },
  "tasks": [
    {
      "id": string (unique e.g. "task_01"),
      "name": string (human description),
      "toolName": string (e.g. "ai_video_upscaler", "audio_noise_filter", "vfx_particle_fire_generator", "color_lut_mapper", "subtitle_generator"),
      "moduleName": string (e.g. "color", "audio", "vfx", "timeline", "render"),
      "params": object (parameters tailored to the tool),
      "dependencies": string[] (dependent task IDs),
      "priority": "low" | "medium" | "high",
      "status": "pending",
      "estimatedDurationMs": number
    }
  ],
  "language": string,
  "isMultiStep": boolean,
  "confidence": number,
  "followUpQuestions": string[]
}
Keep it precise and correct. Ensure dependency IDs match other task ids in the array.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["intent", "entities", "tasks", "language", "isMultiStep", "confidence", "followUpQuestions"],
          properties: {
            intent: { type: Type.STRING },
            entities: { type: Type.OBJECT },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "toolName", "moduleName", "params", "dependencies", "priority", "status", "estimatedDurationMs"],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  toolName: { type: Type.STRING },
                  moduleName: { type: Type.STRING },
                  params: { type: Type.OBJECT },
                  dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  priority: { type: Type.STRING },
                  status: { type: Type.STRING },
                  estimatedDurationMs: { type: Type.INTEGER }
                }
              }
            },
            language: { type: Type.STRING },
            isMultiStep: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text) as IParsedResult;
      return parsed;
    }
    return null;
  }

  /**
   * Language Detector supporting multi-lingual prompt parsing
   */
  public detectLanguage(prompt: string): string {
    const lower = prompt.toLowerCase();
    // Simple robust check for key languages
    if (/[\u0600-\u06FF]/.test(prompt)) return "Arabic";
    if (lower.includes("gracia") || lower.includes("por favor") || lower.includes("video") && lower.includes("con")) return "Spanish";
    if (lower.includes("bonjour") || lower.includes("s'il vous plaît") || lower.includes("vidéo")) return "French";
    if (lower.includes("hallo") || lower.includes("bitte")) return "German";
    if (lower.includes("ciao") || lower.includes("grazie")) return "Italian";
    return "English";
  }

  /**
   * Offline Heuristic Parser that handles standard workflow mapping instantly
   */
  private parseOffline(prompt: string, language: string, context: string[]): IParsedResult {
    const lower = prompt.toLowerCase();
    const tasks: IAiTask[] = [];
    const entities: Record<string, any> = {};
    let intent = "general_editing";
    let isMultiStep = false;
    let confidence = 0.85;
    const followUpQuestions: string[] = [];

    // Analyze intent & extract entities + tasks
    const hasColor = lower.includes("color") || lower.includes("grade") || lower.includes("lut") || lower.includes("cinematic") || lower.includes("retro");
    const hasAudio = lower.includes("audio") || lower.includes("noise") || lower.includes("silence") || lower.includes("hum") || lower.includes("vocal") || lower.includes("voice");
    const hasSubtitles = lower.includes("subtitle") || lower.includes("subtitles") || lower.includes("transcribe") || lower.includes("caption") || lower.includes("translate");
    const hasUpscale = lower.includes("upscale") || lower.includes("stabilize") || lower.includes("enhance") || lower.includes("4k") || lower.includes("8k");
    const hasVfx = lower.includes("vfx") || lower.includes("fire") || lower.includes("particle") || lower.includes("smoke") || lower.includes("matte") || lower.includes("roto");

    // Multiple flags set means a multi-step operation
    const stepsCount = [hasColor, hasAudio, hasSubtitles, hasUpscale, hasVfx].filter(Boolean).length;
    if (stepsCount > 1) {
      isMultiStep = true;
      intent = "complex_workflow";
    } else if (hasColor) intent = "color_grading";
    else if (hasAudio) intent = "audio_restoration";
    else if (hasSubtitles) intent = "subtitle_generation";
    else if (hasUpscale) intent = "video_processing";
    else if (hasVfx) intent = "vfx_addition";

    // Build execution graph sequentially or with logical dependencies
    let lastTaskId = "";

    if (hasAudio) {
      const taskId = "task_audio_noise_filter";
      const dbThreshold = lower.includes("heavy") ? -24 : lower.includes("light") ? -12 : -18;
      entities.noiseLevel = lower.includes("heavy") ? "high" : "normal";
      
      tasks.push({
        id: taskId,
        name: "Surgically clean up background audio noise and isolate speech frequencies",
        toolName: "audio_noise_filter",
        moduleName: "audio",
        params: { db_threshold: dbThreshold, spectral_subtraction_pct: 85, targetTrackIndex: 0 },
        dependencies: [],
        priority: "high",
        status: "pending",
        estimatedDurationMs: 15000
      });
      lastTaskId = taskId;
    }

    if (hasUpscale) {
      const taskId = "task_video_upscaler";
      const targetRes = lower.includes("8k") ? "8K" : "4K";
      entities.targetResolution = targetRes;

      tasks.push({
        id: taskId,
        name: `Enhance video track layers using deep neural flow upscaler to ${targetRes}`,
        toolName: "ai_video_upscaler",
        moduleName: "video",
        params: { target_resolution: targetRes, model_profile: "neural_flow_v3" },
        dependencies: lastTaskId ? [lastTaskId] : [],
        priority: "medium",
        status: "pending",
        estimatedDurationMs: 120000
      });
      lastTaskId = taskId;
    }

    if (hasVfx) {
      const taskId = "task_vfx_fire_generator";
      entities.vfxType = lower.includes("fire") ? "fire" : "particle";
      
      tasks.push({
        id: taskId,
        name: "Generate custom VFX flame turbulence and temperature heat overlays on coordinates",
        toolName: "vfx_particle_fire_generator",
        moduleName: "vfx",
        params: { temperature: 1800, turbulence: 0.65, wind_velocity: [0.1, -1.0, 0.0] },
        dependencies: lastTaskId ? [lastTaskId] : [],
        priority: "medium",
        status: "pending",
        estimatedDurationMs: 45000
      });
      lastTaskId = taskId;
    }

    if (hasColor) {
      const taskId = "task_color_lut_mapper";
      let lut = "kodak_warm_500t";
      if (lower.includes("cinematic")) lut = "cinematic_hollywood_cyan";
      if (lower.includes("fuji") || lower.includes("cool")) lut = "fuji_velvia_cool";
      entities.lutName = lut;

      tasks.push({
        id: taskId,
        name: `Apply cinematic color grading LUT: [${lut}] with HDR contrast balancing`,
        toolName: "color_lut_mapper",
        moduleName: "color",
        params: { lutName: lut, intensity: 0.85 },
        dependencies: lastTaskId ? [lastTaskId] : [],
        priority: "high",
        status: "pending",
        estimatedDurationMs: 2500
      });
      lastTaskId = taskId;
    }

    if (hasSubtitles) {
      const taskId = "task_subtitle_generator";
      let targetLang = "English";
      if (lower.includes("arabic") || lower.includes("عربي")) targetLang = "Arabic";
      if (lower.includes("spanish") || lower.includes("español")) targetLang = "Spanish";
      entities.targetLanguage = targetLang;

      tasks.push({
        id: taskId,
        name: `Transcribe dialog sequence and generate matching subtitles in [${targetLang}]`,
        toolName: "subtitle_generator",
        moduleName: "subtitle",
        params: { targetLanguage: targetLang, autoTranslate: targetLang !== "English", styling: "bold_caps" },
        dependencies: lastTaskId ? [lastTaskId] : [],
        priority: "low",
        status: "pending",
        estimatedDurationMs: 30000
      });
    }

    // Default task if none identified
    if (tasks.length === 0) {
      tasks.push({
        id: "task_timeline_consolidate",
        name: "Consolidate active project clips and refresh workspace track view",
        toolName: "timeline_consolidate",
        moduleName: "timeline",
        params: {},
        dependencies: [],
        priority: "low",
        status: "pending",
        estimatedDurationMs: 500
      });
      followUpQuestions.push(
        "Would you like me to clean background noise from your vocal tracks?",
        "Do you want me to apply a cinematic orange & teal color grade to this project?"
      );
    }

    // Dynamic follow-ups based on parsed intents
    if (hasColor && !hasSubtitles) {
      followUpQuestions.push("Should I also generate transcription subtitles for your active sequence?");
    }
    if (hasAudio && !hasColor) {
      followUpQuestions.push("Would you like me to grade your video tracks with a matching warm cinematic LUT?");
    }

    return {
      intent,
      entities,
      tasks,
      language,
      isMultiStep,
      confidence,
      followUpQuestions
    };
  }
}
