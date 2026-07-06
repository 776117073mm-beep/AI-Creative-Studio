export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  value: any;
}

export interface WorkflowNode {
  id: string;
  type: "action" | "conditional" | "loop" | "parallel_group";
  label: string;
  toolName: string;
  inputMapping: Record<string, string>; // Maps variables/node-outputs to task inputs
  outputMapping: Record<string, string>; // Maps task outputs to variables
  parameters: Record<string, any>;
  
  // Graph links
  nextNodes: string[]; // For sequential/branch routing
  conditionalBranches?: {
    trueNodeId: string;
    falseNodeId: string;
    expression: string; // e.g. "variables.hasVfxCredits === true"
  };
  
  loopConfig?: {
    iteratorVariable: string; // e.g. "variables.videoClipList"
    loopNodeId: string;
  };

  parallelNodes?: WorkflowNode[]; // Sub-nodes to run concurrently
}

export interface WorkflowGraph {
  id: string;
  name: string;
  nodes: Map<string, WorkflowNode>;
  startNodeId: string;
  variables: Record<string, WorkflowVariable>;
  scheduleCron?: string; // Standard cron or "auto"
}

export class WorkflowEngineFoundation {
  private static instance: WorkflowEngineFoundation;
  private activeTemplates: Map<string, WorkflowGraph> = new Map();

  private constructor() {
    this.registerSampleTemplates();
  }

  public static getInstance(): WorkflowEngineFoundation {
    if (!WorkflowEngineFoundation.instance) {
      WorkflowEngineFoundation.instance = new WorkflowEngineFoundation();
    }
    return WorkflowEngineFoundation.instance;
  }

  public registerTemplate(graph: WorkflowGraph): void {
    this.activeTemplates.set(graph.id, graph);
    console.log(`[WorkflowEngine] Registered template workflow: ${graph.name}`);
  }

  public async executeWorkflow(
    graph: WorkflowGraph,
    onProgress?: (nodeId: string, status: string, progress: number) => void
  ): Promise<Record<string, any>> {
    console.log(`%c [WorkflowEngine] Executing Workflow Graph: ${graph.name}`, "color: #3b82f6; font-weight: bold;");
    const executionContext = {
      variables: { ...graph.variables },
      outputs: {} as Record<string, any>
    };

    let currentNodeId: string | undefined = graph.startNodeId;
    const visitedNodes = new Set<string>();

    while (currentNodeId) {
      if (visitedNodes.has(currentNodeId)) {
        console.warn(`[WorkflowEngine] Infinite loop warning prevented at Node: ${currentNodeId}`);
        break;
      }
      visitedNodes.add(currentNodeId);

      const node = graph.nodes.get(currentNodeId);
      if (!node) {
        throw new Error(`[WorkflowEngine] Execution error: Node [${currentNodeId}] not found in graph.`);
      }

      if (onProgress) onProgress(node.id, "running", 0);

      // Execute node based on type
      if (node.type === "parallel_group" && node.parallelNodes) {
        console.log(`[WorkflowEngine] Launching Parallel Node Lane: ${node.label}`);
        await Promise.all(node.parallelNodes.map(subNode => {
          return this.runActionNode(subNode, executionContext);
        }));
        if (onProgress) onProgress(node.id, "completed", 100);
        currentNodeId = node.nextNodes[0];
      } 
      else if (node.type === "conditional" && node.conditionalBranches) {
        const decision = this.evaluateCondition(node.conditionalBranches.expression, executionContext);
        console.log(`[WorkflowEngine] Evaluated branch condition [${node.conditionalBranches.expression}]: ${decision}`);
        if (onProgress) onProgress(node.id, "completed", 100);
        currentNodeId = decision ? node.conditionalBranches.trueNodeId : node.conditionalBranches.falseNodeId;
      } 
      else if (node.type === "loop" && node.loopConfig) {
        const listToIterate = executionContext.variables[node.loopConfig.iteratorVariable]?.value || [];
        console.log(`[WorkflowEngine] Looping across ${listToIterate.length} items for: ${node.label}`);
        
        for (let i = 0; i < listToIterate.length; i++) {
          const item = listToIterate[i];
          const subContext = {
            variables: {
              ...executionContext.variables,
              loop_item: { name: "loop_item", type: "string" as any, value: item }
            },
            outputs: { ...executionContext.outputs }
          };
          
          if (node.loopConfig.loopNodeId) {
            const subNode = graph.nodes.get(node.loopConfig.loopNodeId);
            if (subNode) {
              await this.runActionNode(subNode, subContext);
            }
          }
        }
        if (onProgress) onProgress(node.id, "completed", 100);
        currentNodeId = node.nextNodes[0];
      } 
      else {
        // Simple sequential Action Node
        await this.runActionNode(node, executionContext);
        if (onProgress) onProgress(node.id, "completed", 100);
        currentNodeId = node.nextNodes[0];
      }
    }

    console.log(`%c [WorkflowEngine] Execution successfully completed for: ${graph.name}`, "color: #10b981; font-weight: bold;");
    return executionContext.outputs;
  }

  private async runActionNode(node: WorkflowNode, context: any): Promise<void> {
    console.log(`[WorkflowEngine] Running Action Node: ${node.label} (${node.toolName})`);
    
    // Process input mappings
    const resolvedInputs: Record<string, any> = {};
    for (const [paramName, sourcePath] of Object.entries(node.inputMapping)) {
      if (sourcePath.startsWith("variables.")) {
        const varName = sourcePath.replace("variables.", "");
        resolvedInputs[paramName] = context.variables[varName]?.value;
      } else {
        resolvedInputs[paramName] = sourcePath; // literal fallback
      }
    }

    // Simulate action latency and process computation
    await new Promise(resolve => setTimeout(resolve, 250));
    const finalOutput = `processed_output_of_${node.toolName}_with_${JSON.stringify(resolvedInputs)}`;
    
    context.outputs[node.id] = finalOutput;

    // Process output mapping back to global variables
    for (const [outputKey, targetVar] of Object.entries(node.outputMapping)) {
      if (context.variables[targetVar]) {
        context.variables[targetVar].value = finalOutput;
      }
    }
  }

  private evaluateCondition(expression: string, context: any): boolean {
    if (expression.includes("===")) {
      const parts = expression.split("===");
      const left = parts[0].trim();
      const right = parts[1].trim();
      
      let leftVal = left;
      if (left.startsWith("variables.")) {
        const varName = left.replace("variables.", "");
        leftVal = context.variables[varName]?.value;
      }

      let rightVal: any = right;
      if (right === "true") rightVal = true;
      if (right === "false") rightVal = false;

      return leftVal === rightVal;
    }
    return true;
  }

  private registerSampleTemplates(): void {
    const nodes = new Map<string, WorkflowNode>();
    
    nodes.set("node_1", {
      id: "node_1",
      type: "action",
      label: "Isolate Audio Vocalist Stem",
      toolName: "audio_vocal_isolator",
      inputMapping: { clipName: "variables.rawClipName" },
      outputMapping: { result: "vocalStemFile" },
      parameters: { modelVersion: "v2-stable" },
      nextNodes: ["node_2"]
    });

    nodes.set("node_2", {
      id: "node_2",
      type: "conditional",
      label: "Evaluate Vocal Clarity Grade",
      toolName: "ai_quality_grader",
      inputMapping: {},
      outputMapping: {},
      parameters: {},
      nextNodes: [],
      conditionalBranches: {
        trueNodeId: "node_3_vfx",
        falseNodeId: "node_3_fallback",
        expression: "variables.vocalGraderHigh === true"
      }
    });

    nodes.set("node_3_vfx", {
      id: "node_3_vfx",
      type: "action",
      label: "Burn High Clarity Subtitles",
      toolName: "subtitle_burner",
      inputMapping: {},
      outputMapping: {},
      parameters: { stylePreset: "cinematic-italic" },
      nextNodes: []
    });

    nodes.set("node_3_fallback", {
      id: "node_3_fallback",
      type: "action",
      label: "Trigger Vocal Equalization Repair",
      toolName: "eq_correction_filter",
      inputMapping: {},
      outputMapping: {},
      parameters: { gainDb: 3 },
      nextNodes: []
    });

    const sampleGraph: WorkflowGraph = {
      id: "workflow_vfx_mastering",
      name: "Smart Cinema VFX & Mastering Engine",
      nodes,
      startNodeId: "node_1",
      variables: {
        rawClipName: { name: "rawClipName", type: "string", value: "raw_vocalist_sample_4k.mov" },
        vocalGraderHigh: { name: "vocalGraderHigh", type: "boolean", value: true }
      }
    };

    this.registerTemplate(sampleGraph);
  }
}
