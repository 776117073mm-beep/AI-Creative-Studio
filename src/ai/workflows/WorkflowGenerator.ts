import { IAiTask, IAiExecutionPlan } from "../types";
import { SavedWorkflow } from "../../types";
import { WorkflowNode } from "../../workflows/index";

export class WorkflowGenerator {
  private static instance: WorkflowGenerator;

  private constructor() {}

  public static getInstance(): WorkflowGenerator {
    if (!WorkflowGenerator.instance) {
      WorkflowGenerator.instance = new WorkflowGenerator();
    }
    return WorkflowGenerator.instance;
  }

  /**
   * Compiles an AI execution plan into a native studio workflow that the WorkflowEngine can run
   */
  public generateNativeWorkflow(plan: IAiExecutionPlan): { workflow: SavedWorkflow; nodes: WorkflowNode[] } {
    const workflowId = `wf_${Math.random().toString(36).substring(2, 9)}`;
    const tasks = Object.values(plan.graph.nodes);

    const savedWorkflow: SavedWorkflow = {
      id: workflowId,
      name: `AI Generated: ${plan.originalRequest.substring(0, 30)}...`,
      description: `Automated orchestrator workflow for request: "${plan.originalRequest}"`,
      nodesCount: tasks.length,
      lastUsed: "Just now",
      isFavorite: false
    };

    const nodes: WorkflowNode[] = tasks.map(task => {
      // Find downstream tasks that depend on this task to establish execution links
      const downstreamTaskIds = tasks
        .filter(t => t.dependencies.includes(task.id))
        .map(t => t.id);

      return {
        id: task.id,
        toolName: task.toolName,
        params: task.params,
        nextNodes: downstreamTaskIds
      };
    });

    return {
      workflow: savedWorkflow,
      nodes
    };
  }
}
