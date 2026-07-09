import { useCallback, useState } from "react";
import { parseIntentFallback, TaskGraph } from "../../core/orchestrator/intentParser";
import { evaluateHardware, routeGraph, RoutedTask } from "../../core/orchestrator/hardwareRouter";

export interface OrchestratorStatusStep {
  id: string;
  label: string;
  status: "idle" | "running" | "completed" | "failed";
}

export function useAIOrchestrator(onComplete?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusSteps, setStatusSteps] = useState<OrchestratorStatusStep[]>([]);
  const [taskGraph, setTaskGraph] = useState<TaskGraph | null>(null);
  const [summary, setSummary] = useState<string>("");

  const submitPrompt = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setStatusSteps([
      { id: "parse", label: "Parsing prompt", status: "running" },
      { id: "route", label: "Routing task graph", status: "idle" },
      { id: "execute", label: "Executing tasks", status: "idle" }
    ]);

    try {
      const graph = parseIntentFallback(prompt);
      setTaskGraph(graph);
      setStatusSteps(prev => prev.map(step => step.id === "parse" ? { ...step, status: "completed" } : step));

      const hardwareProfile = await evaluateHardware();
      const routedTasks = routeGraph(graph, hardwareProfile);
      setStatusSteps(prev => prev.map(step => step.id === "route" ? { ...step, status: "running" } : step));

      await new Promise(resolve => setTimeout(resolve, 700));
      setStatusSteps(prev => prev.map(step => step.id === "route" ? { ...step, status: "completed" } : step));
      setStatusSteps(prev => prev.map(step => step.id === "execute" ? { ...step, status: "running" } : step));

      await new Promise(resolve => setTimeout(resolve, 1200));
      setStatusSteps(prev => prev.map(step => step.id === "execute" ? { ...step, status: "completed" } : step));

      setSummary(
        `Generated ${routedTasks.length} task(s) for prompt: ${prompt}. ` +
        `Routed tasks to ${routedTasks.filter(t => t.route === "cloud").length} cloud / ${routedTasks.filter(t => t.route === "local").length} local nodes.`
      );

      if (onComplete) {
        onComplete();
      }

      return { success: true, graph, routedTasks };
    } catch (error) {
      setStatusSteps(prev => prev.map(step => step.status === "running" ? { ...step, status: "failed" } : step));
      setSummary(`Orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: error instanceof Error ? error.message : String(error), graph: null, routedTasks: [] };
    } finally {
      setIsLoading(false);
    }
  }, [onComplete]);

  return {
    isLoading,
    statusSteps,
    taskGraph,
    summary,
    submitPrompt,
  };
}
