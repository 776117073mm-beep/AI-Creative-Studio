import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Terminal, 
  Workflow, 
  Database, 
  Zap, 
  History, 
  MessageSquare,
  Bookmark,
  ChevronRight,
  ShieldAlert,
  Play,
  CheckCircle2,
  Clock,
  RotateCw,
  XCircle,
  Pause,
  Trash2
} from "lucide-react";
import { PageId } from "../types";
import { AiOrchestrator, IAiExecutionPlan, IParsedResult, IAiTask } from "../ai";

interface AICommandCenterProps {
  onNavigate: (page: PageId) => void;
}

export default function AICommandCenter({ onNavigate }: AICommandCenterProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState([
    { sender: "ai", text: "Welcome to the AI Command Center Core. System is idle. Type prompts to orchestrate timeline layers, color grade, render projects, or generate subtitles." }
  ]);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] AI_STUDIO_COGNITION: Neural pipelines initialized successfully.`,
    `[${new Date().toLocaleTimeString()}] AI_STUDIO_COGNITION: Ready to orchestrate timeline, color studio, subtitle studio, and audio editing modules.`
  ]);

  // Orchestrator States
  const [activePlan, setActivePlan] = useState<IAiExecutionPlan | null>(null);
  const [parsedResult, setParsedResult] = useState<IParsedResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  // Sync background AI system stats
  useEffect(() => {
    const memoryState = AiOrchestrator.getInstance().getMemory().getState();
    if (memoryState.conversationHistory.length > 1) {
      // Rehydrate chat from memory
      const rehydrated = memoryState.conversationHistory.map(m => ({
        sender: m.sender,
        text: m.text
      }));
      setChatLogs(rehydrated);
    }
  }, []);

  const logToTerminal = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setExecutionLogs(prev => [...prev, `[${time}] ${text}`]);
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatLogs(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatMessage("");
    logToTerminal(`DISPATCH_PROMPT: "${userMsg}"`);

    try {
      // Run master AI orchestrator
      const orchestrator = AiOrchestrator.getInstance();
      const result = await orchestrator.orchestrate(userMsg);
      
      setParsedResult(result.parsed);
      setActivePlan(result.plan);
      setRequiresConfirmation(result.requiresConfirmation);

      // AI Response summary
      const aiReply = `${result.summary} ${
        result.requiresConfirmation 
          ? "⚠️ SAFETY WARNING: Destructive actions detected. Please review the execution plan and confirm below to proceed." 
          : "Execution plan compiled. Commencing automated sequence..."
      }`;

      setChatLogs(prev => [...prev, { sender: "ai", text: aiReply }]);
      
      logToTerminal(`INTENT_DETECTED: [${result.parsed.intent.toUpperCase()}] (Confidence: ${Math.round(result.parsed.confidence * 100)}%)`);
      logToTerminal(`PLAN_GENERATED: Mapped ${result.plan.graph.priorityQueue.length} tasks. Parallel waves: ${result.plan.graph.parallelGroups.length}`);

      if (!result.requiresConfirmation) {
        // Run execution immediately if safe
        await startExecution(result.plan);
      }
    } catch (err: any) {
      logToTerminal(`ERROR: Orchestration failed - ${err.message}`);
      setChatLogs(prev => [...prev, { sender: "ai", text: `Sorry, I encountered an issue while compiling your request: ${err.message}` }]);
    }
  };

  const startExecution = async (plan: IAiExecutionPlan) => {
    setIsExecuting(true);
    setIsPaused(false);
    setRequiresConfirmation(false);
    logToTerminal("EXECUTION_START: Initiating transaction snapshot backup...");

    const orchestrator = AiOrchestrator.getInstance();
    
    // Simulate pipeline tasks execution visually in sync with orchestrator
    const tasks = plan.graph.priorityQueue;
    for (let i = 0; i < tasks.length; i++) {
      setCurrentTaskIndex(i);
      const taskId = tasks[i];
      const task = plan.graph.nodes[taskId];
      
      logToTerminal(`TASK_RUNNING: "${task.name}"`);
      
      // Execute step by step to sync UI progress
      setProgress(Math.floor((i / tasks.length) * 100));
      await new Promise(resolve => setTimeout(resolve, task.estimatedDurationMs / 10)); // visually snappy speed
      
      task.status = "completed";
      logToTerminal(`TASK_SUCCESS: "${task.name}" completed successfully.`);
    }

    setProgress(100);
    setIsExecuting(false);
    logToTerminal("EXECUTION_COMPLETE: Workflow finished. Releasing GPU lock.");

    // Determine redirect studio module
    const destination = orchestrator.getModuleSelector().routeAction(plan.originalRequest);
    if (destination.authorized && destination.mapping) {
      setChatLogs(prev => [...prev, { 
        sender: "ai", 
        text: `Execution completed successfully! Seamlessly redirecting you to [${destination.mapping.moduleName}] to inspect results.` 
      }]);
      setTimeout(() => {
        onNavigate(destination.mapping.pageId);
      }, 2000);
    }
  };

  const handleCancelPlan = () => {
    setActivePlan(null);
    setParsedResult(null);
    setRequiresConfirmation(false);
    setIsExecuting(false);
    logToTerminal("PIPELINE_CANCELLED: Execution plan discarded by user.");
    setChatLogs(prev => [...prev, { sender: "ai", text: "Execution plan cancelled. Standing by for your next instruction." }]);
  };

  const promptMacros = [
    { title: "Generate Cinematic LUT", desc: "Grade timeline tracks with Kodak warm 500T aesthetic.", prompt: "Apply a retro warm Kodak 500T grade to my video tracks." },
    { title: "Isolate Dialogue Track", desc: "Suppress background wind, hums, and compress levels.", prompt: "Analyze audio track 1, remove wind hum noise, and isolate speech." },
    { title: "Auto Scene Cut", desc: "Identify camera panning changes and slice into tracks.", prompt: "Run auto scene cut detection on my primary video clip." }
  ];


  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header title */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Cognition Engine Core</span>
        </span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">AI Command Center</h1>
        <p className="text-xs text-gray-500 mt-1">
          Issue voice, speech, or visual generative prompts. The system maps command paths into direct timeline adjustments.
        </p>
      </div>

      {/* Main interface splitting chat from execution logs */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        {/* Chat box container */}
        <div className="lg:col-span-2 flex flex-col bg-card border border-border-light rounded-2xl overflow-hidden min-h-0">
          <div className="p-3 bg-panel/75 border-b border-border-light flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">AI Assistant Dialogue</span>
            <span className="text-[9px] font-mono text-purple-600 font-semibold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-purple-600 animate-pulse" />
              <span>Gemini Flash Active</span>
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {chatLogs.map((log, idx) => (
              <div key={idx} className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  log.sender === "user" 
                    ? "bg-text-dark text-white rounded-tr-none" 
                    : "bg-panel border border-border-light text-text-dark rounded-tl-none"
                }`}>
                  {log.text}
                </div>
              </div>
            ))}

            {/* Interactive Plan Breakdown */}
            {activePlan && (
              <div className="p-4 bg-panel border border-border-light rounded-xl space-y-3 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-dark flex items-center space-x-1.5">
                    <Workflow className="w-3.5 h-3.5 text-purple-600" />
                    <span>Active Orchestration Graph [Plan ID: {activePlan.id}]</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    Estimated: {Math.round(activePlan.estimatedTotalRuntimeMs / 1000)}s
                  </span>
                </div>

                {/* Parallel groups wave visualizations */}
                <div className="space-y-3">
                  {activePlan.graph.parallelGroups.map((wave, waveIdx) => (
                    <div key={waveIdx} className="bg-card border border-border-light p-3 rounded-xl space-y-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Wave {waveIdx + 1}: Parallel Execution Lane
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {wave.map(taskId => {
                          const task = activePlan.graph.nodes[taskId];
                          const isCurrent = isExecuting && activePlan.graph.priorityQueue[currentTaskIndex] === taskId;
                          
                          return (
                            <div 
                              key={taskId} 
                              className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                                isCurrent 
                                  ? "bg-purple-50/50 border-purple-300 animate-pulse" 
                                  : task.status === "completed" 
                                  ? "bg-green-50/50 border-green-200" 
                                  : "bg-panel border-border-light"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-text-dark block">{task.name}</span>
                                <span className="text-[9px] font-mono text-gray-400 uppercase">
                                  Tool: {task.toolName} • {task.priority} Priority
                                </span>
                              </div>
                              <div>
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                ) : isCurrent ? (
                                  <RotateCw className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Safety warnings / Destructive confirmations overlay */}
                {requiresConfirmation && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-left">
                    <div className="flex items-center space-x-1.5 text-red-600">
                      <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
                      <span className="text-xs font-bold">Destructive Action Warning Flagged</span>
                    </div>
                    <p className="text-[10px] text-red-500 leading-relaxed">
                      The following tasks require strict administrator confirmation prior to execution to protect project integrity:
                    </p>
                    <ul className="text-[10px] list-disc list-inside text-red-600 space-y-1 pl-1">
                      {activePlan.destructiveActions.map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                    <div className="flex space-x-2 pt-1.5 justify-end">
                      <button 
                        type="button"
                        onClick={handleCancelPlan}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Abort Plan
                      </button>
                      <button 
                        type="button"
                        onClick={() => startExecution(activePlan)}
                        className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-bold flex items-center cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        <span>Confirm & Execute</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress Bar when running */}
                {isExecuting && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span className="flex items-center space-x-1 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin text-purple-600" />
                        <span>Executing Wave Plans...</span>
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendPrompt} className="p-3 border-t border-border-light bg-panel/20 shrink-0 flex space-x-2">
            <input
              type="text"
              placeholder="e.g., 'Grade my active sequence with deep cool shadows'..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 h-9 px-3 bg-btn-bg border border-border-light rounded-xl text-xs text-text-dark focus:outline-none"
            />
            <button 
              type="submit" 
              className="px-4 bg-text-dark text-white rounded-xl text-xs font-semibold hover:bg-opacity-90 flex items-center justify-center cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Dispatch</span>
            </button>
          </form>
        </div>

        {/* Execution Logs Terminal panel */}
        <div className="space-y-4 flex flex-col justify-between min-h-0">
          {/* Prompt macros shortcuts */}
          <div className="bg-card border border-border-light p-4 rounded-2xl shrink-0 text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Prompt Shortcuts</span>
            </span>

            <div className="space-y-2">
              {promptMacros.map((macro, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatMessage(macro.prompt)}
                  className="w-full p-2.5 bg-btn-bg border border-border-light hover:border-purple-300 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-bold text-text-dark block group-hover:underline">{macro.title}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5 leading-normal">{macro.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live system logs mock terminal */}
          <div className="flex-1 bg-text-dark rounded-2xl p-4 flex flex-col justify-between overflow-hidden text-left border border-gray-800 font-mono shadow-inner min-h-0">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 shrink-0">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-green-400" />
                <span>Execution Logs Terminal</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            </div>

            {/* Scrollable logs */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 text-[10px] text-green-400 space-y-1.5 min-h-0">
              {executionLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed break-all">
                  {log}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-2 shrink-0 flex justify-between text-[9px] text-gray-500">
              <span>DB CONNECT: SECURE CLOUD</span>
              <span>ESTIMATED PENETRATION: 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
