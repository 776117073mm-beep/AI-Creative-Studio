import { ToolRegistry } from "../../registry/ToolRegistry";
import { ITool } from "../../interfaces";

export class ToolSelector {
  private static instance: ToolSelector;

  private constructor() {}

  public static getInstance(): ToolSelector {
    if (!ToolSelector.instance) {
      ToolSelector.instance = new ToolSelector();
    }
    return ToolSelector.instance;
  }

  /**
   * Discovers and chooses the best tool registered in the platform for a given abstract operation
   */
  public selectTool(abstractOperation: string, constraints: { gpuAvailable?: boolean; priority?: string } = {}): { tool: ITool; speedRank: number; warning?: string } {
    const registry = ToolRegistry.getInstance();
    const allTools = registry.listTools();

    // 1. Filter tools matching category or name identifiers
    const searchTerms = abstractOperation.toLowerCase().split(/[_\s]/);
    const matches = allTools.filter(tool => {
      const nameLower = tool.metadata.name.toLowerCase();
      const descLower = tool.metadata.description.toLowerCase();
      const catLower = tool.metadata.category.toLowerCase();
      
      return searchTerms.some(term => 
        nameLower.includes(term) || 
        descLower.includes(term) || 
        catLower.includes(term)
      );
    });

    if (matches.length === 0) {
      // Fallback search to find any general utility tool or default to upscaler
      const fallback = registry.getTool("ai_video_upscaler");
      if (!fallback) {
        throw new Error(`[ToolSelector] No tool matching [${abstractOperation}] found and fallback tool registry is empty.`);
      }
      return { tool: fallback, speedRank: 3, warning: `Strict Match Fail: Falling back to general video upscaler.` };
    }

    // 2. Select the fastest tool and resolve hardware bottlenecks
    let bestTool = matches[0];
    let bestScore = -9999;

    matches.forEach(tool => {
      let score = 0;
      
      // Calculate estimated runtime score (lower is better, mapped to positive points)
      const runtimeStr = tool.metadata.estimatedRuntime.toLowerCase();
      if (runtimeStr.includes("ms") || runtimeStr.includes("fast")) score += 500;
      else if (runtimeStr.includes("s")) {
        const secs = parseInt(runtimeStr) || 10;
        score += (120 - secs); // faster tools get higher scores
      } else if (runtimeStr.includes("m")) {
        const mins = parseInt(runtimeStr) || 5;
        score -= (mins * 60); // slower tools lose score
      }

      // GPU matching
      if (tool.metadata.gpuRequired) {
        if (constraints.gpuAvailable !== false) {
          score += 150; // Boost GPU performance if hardware is idle
        } else {
          score -= 300; // Heavily penalize GPU tools if running in low-resource environments
        }
      }

      // Memory footprint preference
      const memStr = tool.metadata.memoryUsage.toLowerCase();
      if (memStr.includes("gb")) {
        const gb = parseInt(memStr) || 8;
        score -= (gb * 10); // penalize heavy RAM tools slightly
      }

      if (score > bestScore) {
        bestScore = score;
        bestTool = tool;
      }
    });

    return {
      tool: bestTool,
      speedRank: bestScore > 100 ? 1 : bestScore > 0 ? 2 : 3
    };
  }

  /**
   * Discovers all available platform tools categorized neatly
   */
  public discoverTools(): Record<string, string[]> {
    const registry = ToolRegistry.getInstance();
    const tools = registry.listTools();
    const map: Record<string, string[]> = {};

    tools.forEach(t => {
      const cat = t.metadata.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push(t.metadata.name);
    });

    return map;
  }
}
