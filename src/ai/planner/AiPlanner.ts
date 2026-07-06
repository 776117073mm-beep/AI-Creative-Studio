import { IAiTask, IAiExecutionGraph, IAiExecutionPlan } from "../types";

export class AiPlanner {
  private static instance: AiPlanner;

  private constructor() {}

  public static getInstance(): AiPlanner {
    if (!AiPlanner.instance) {
      AiPlanner.instance = new AiPlanner();
    }
    return AiPlanner.instance;
  }

  /**
   * Generates a fully optimized execution plan from a list of unstructured tasks
   */
  public generatePlan(originalRequest: string, rawTasks: IAiTask[]): IAiExecutionPlan {
    const nodes: Record<string, IAiTask> = {};
    const edges: { from: string; to: string }[] = [];
    const optimizationNotes: string[] = [];

    // Initialize tasks and set standard retry profiles
    rawTasks.forEach(task => {
      nodes[task.id] = {
        ...task,
        status: "pending",
        retryCount: 0,
        maxRetries: task.maxRetries ?? 3
      };
    });

    // Populate edges based on declared dependencies
    rawTasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (nodes[depId]) {
          edges.push({ from: depId, to: task.id });
        } else {
          optimizationNotes.push(`Warning: Dependency [${depId}] of Task [${task.id}] was not found in task set. Dropped.`);
        }
      });
    });

    // Resolve sequential priority queue via topological sorting
    let priorityQueue: string[] = [];
    try {
      priorityQueue = this.topologicalSort(nodes, edges);
      optimizationNotes.push("Successfully resolved topological sorting for task execution pipeline.");
    } catch (err: any) {
      // Direct fallback to serial list if circularity or errors occur
      priorityQueue = Object.keys(nodes);
      optimizationNotes.push(`Sorting Fallback: Serial grouping triggered due to topological sorting warning: ${err.message}`);
    }

    // Solve Parallel Executable lanes to boost latency speeds
    const parallelGroups = this.computeParallelGroups(nodes, edges, priorityQueue);
    if (parallelGroups.length > 1) {
      optimizationNotes.push(`Optimized execution path into [${parallelGroups.length}] parallel/sequential waves to reduce cold-start latency.`);
    }

    // Evaluate destructive actions & safety flags
    const destructiveActions: string[] = [];
    let requiresConfirmation = false;

    rawTasks.forEach(task => {
      const toolName = task.toolName.toLowerCase();
      if (toolName.includes("delete") || toolName.includes("cut") || toolName.includes("overwrite") || toolName.includes("wipe")) {
        destructiveActions.push(`Task [${task.id}] triggers potential deletion parameter: ${task.name}`);
        requiresConfirmation = true;
      }
    });

    // Calculate overall estimated runtime factoring in parallel processing capability
    let estimatedTotalRuntimeMs = 0;
    parallelGroups.forEach(group => {
      // A parallel group runtime is determined by its longest-running task
      const maxMsInGroup = Math.max(...group.map(id => nodes[id]?.estimatedDurationMs ?? 0));
      estimatedTotalRuntimeMs += maxMsInGroup;
    });

    const graph: IAiExecutionGraph = {
      nodes,
      edges,
      parallelGroups,
      priorityQueue
    };

    return {
      id: `plan_${Math.random().toString(36).substring(2, 9)}`,
      originalRequest,
      graph,
      estimatedTotalRuntimeMs,
      optimizationNotes,
      requiresConfirmation,
      destructiveActions
    };
  }

  /**
   * Topological sorting helper to organize tasks based on DAG dependencies
   */
  private topologicalSort(nodes: Record<string, IAiTask>, edges: { from: string; to: string }[]): string[] {
    const visited: Record<string, boolean> = {};
    const temp: Record<string, boolean> = {};
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (temp[nodeId]) {
        throw new Error(`Circular dependency detected at node [${nodeId}]`);
      }
      if (!visited[nodeId]) {
        temp[nodeId] = true;
        // Find children
        const children = edges.filter(e => e.from === nodeId).map(e => e.to);
        children.forEach(visit);

        visited[nodeId] = true;
        temp[nodeId] = false;
        result.unshift(nodeId);
      }
    };

    Object.keys(nodes).forEach(id => {
      if (!visited[id]) {
        visit(id);
      }
    });

    return result.reverse(); // Reverse to get the execution starting order
  }

  /**
   * Identifies sets of tasks that have zero dependencies on each other and can execute concurrently
   */
  private computeParallelGroups(
    nodes: Record<string, IAiTask>,
    edges: { from: string; to: string }[],
    sortedIds: string[]
  ): string[][] {
    const groups: string[][] = [];
    const remainingIds = [...sortedIds];
    const completedTasks = new Set<string>();

    while (remainingIds.length > 0) {
      const currentWave: string[] = [];

      for (let i = 0; i < remainingIds.length; i++) {
        const id = remainingIds[i];
        const task = nodes[id];
        
        // A task is ready if all of its dependencies are in the completed set
        const isReady = task.dependencies.every(depId => completedTasks.has(depId));
        if (isReady) {
          currentWave.push(id);
        }
      }

      if (currentWave.length === 0) {
        // Fallback safety to prevent infinite loops if dependencies are unresolved
        groups.push([remainingIds.shift()!]);
        continue;
      }

      groups.push(currentWave);
      currentWave.forEach(id => {
        completedTasks.add(id);
        const index = remainingIds.indexOf(id);
        if (index > -1) {
          remainingIds.splice(index, 1);
        }
      });
    }

    return groups;
  }
}
