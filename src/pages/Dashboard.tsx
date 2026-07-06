import React, { useState } from "react";
import { 
  FolderKanban, 
  Milestone, 
  FolderOpen, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Pin, 
  Clock, 
  MessageSquare, 
  Send,
  Plus,
  Cpu,
  Database,
  Activity,
  Terminal,
  Settings,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { PageId, Project } from "../types";
import { usePlatform } from "../context/PlatformContext";

interface DashboardProps {
  projects: Project[];
  onSelectProject: (proj: Project) => void;
  onNavigate: (page: PageId) => void;
}

export default function Dashboard({ projects, onSelectProject, onNavigate }: DashboardProps) {
  const { 
    modulesList, 
    pluginsList, 
    servicesList, 
    eventHistory, 
    commandHistory, 
    commandDispatcher, 
    eventBus 
  } = usePlatform();

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Hello! I am your AI Creative Assistant. Ask me to grade videos, isolate audio tracks, or automate subtitle generation!" }
  ]);

  // Command input text state
  const [testCommand, setTestCommand] = useState("system_ping");

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatMessage("");

    // Dispatch custom command
    commandDispatcher.dispatch({
      name: "chat_copilot_request",
      payload: { query: userMsg },
      priority: 100
    });

    // Also publish event
    eventBus.publish("user_chat_submitted", { message: userMsg }, "DashboardUI");

    setTimeout(() => {
      let reply = "I can assist you with that! Which module would you like to load?";
      const lower = userMsg.toLowerCase();
      if (lower.includes("color") || lower.includes("grade")) {
        reply = "I've analyzed your preference. I recommend launching the Color Studio to apply custom HDR LUTs. Click below to load.";
      } else if (lower.includes("audio") || lower.includes("noise") || lower.includes("voice")) {
        reply = "I can isolate voice frequencies and remove up to 24dB of environmental noise. Let's open Audio Mastering.";
      } else if (lower.includes("subtitle") || lower.includes("caption") || lower.includes("text")) {
        reply = "Our Speech-to-Text translation neural net is primed. Opening Subtitle Studio.";
      } else if (lower.includes("render") || lower.includes("export")) {
        reply = "Let's check active rendering parameters. Opening Render Center.";
      }
      setChatHistory(prev => [...prev, { sender: "ai", text: reply }]);
      
      eventBus.publish("ai_response_generated", { reply }, "AICopilot");
    }, 1000);
  };

  const handleTriggerTestCommand = async () => {
    eventBus.publish("diagnostic_check_triggered", { command: testCommand }, "DashboardUI");
    await commandDispatcher.dispatch({
      name: testCommand,
      payload: { timestamp: Date.now() },
      priority: 50,
      metadata: { source: "test_bench" }
    });
  };

  const pinnedProjects = projects.filter(p => p.pinned);
  const recentProjects = projects.filter(p => !p.pinned).slice(0, 3);

  return (
    <div className="space-y-6 p-6 animate-in fade-in-50 duration-200">
      {/* Top Banner Greeting */}
      <div className="flex justify-between items-center bg-card p-6 border border-border-light rounded-2xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE CORE</span>
          <h1 className="text-2xl font-bold text-text-dark tracking-tight mt-1">Welcome back, John</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            You are operating the universal AI Creative Studio foundation. Launch modules below or let the AI Copilot help grade and master your media layers.
          </p>
        </div>
        <button 
          onClick={() => onNavigate("new-project")}
          className="px-4 py-2 bg-text-dark text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs hover:bg-opacity-90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Setup</span>
        </button>
      </div>

      {/* Main split: Projects on left, AI Assistant and News on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Projects and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Starts */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-text-dark uppercase tracking-wide px-1">Quick Start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "Blank Editor Canvas", desc: "Open standard editing panel", page: "workspace", icon: FolderOpen },
                { title: "Import Raw Assets", desc: "Add images, video, audio clips", page: "media", icon: FolderOpen },
                { title: "Setup Project", desc: "Run aspect config wizard", page: "new-project", icon: Milestone }
              ].map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onNavigate(act.page as PageId)}
                    className="p-4 bg-card border border-border-light hover:border-gray-400 text-left rounded-xl hover:shadow-xs transition-all group cursor-pointer"
                  >
                    <div className="p-1.5 bg-panel border border-border-light rounded-lg w-fit mb-3">
                      <Icon className="w-4 h-4 text-gray-700" />
                    </div>
                    <span className="text-xs font-bold text-text-dark block group-hover:underline">{act.title}</span>
                    <span className="text-[10px] text-gray-500 block mt-1">{act.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pinned Projects */}
          {pinnedProjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-text-dark uppercase tracking-wide flex items-center space-x-1.5">
                  <Pin className="w-3.5 h-3.5 text-gray-500" />
                  <span>Pinned Projects</span>
                </h2>
                <button onClick={() => onNavigate("projects")} className="text-[10px] font-semibold text-gray-500 hover:underline flex items-center space-x-1">
                  <span>View All Projects</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pinnedProjects.map((proj) => (
                  <div 
                    key={proj.id} 
                    onClick={() => onSelectProject(proj)}
                    className="bg-card border border-border-light rounded-xl overflow-hidden hover:border-gray-400 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="h-32 bg-gray-200 relative overflow-hidden">
                      <img 
                        src={proj.thumbnail} 
                        alt={proj.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 p-1 bg-white/90 backdrop-blur-xs rounded border border-border-light">
                        <Pin className="w-3 h-3 text-text-dark" />
                      </div>
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/65 backdrop-blur-xs text-white text-[9px] font-mono rounded">
                        {proj.resolution} @ {proj.fps}fps
                      </div>
                    </div>
                    <div className="p-3 text-left">
                      <span className="text-xs font-bold text-text-dark block truncate">{proj.name}</span>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-1">
                          {proj.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-1.5 py-0.5 bg-panel text-[8px] font-semibold text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{proj.updatedAt}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-text-dark uppercase tracking-wide px-1">Recent Projects</h2>
            <div className="space-y-2">
              {recentProjects.map((proj) => (
                <div 
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="p-3 bg-card border border-border-light hover:border-gray-400 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 border border-border-light shrink-0">
                      <img src={proj.thumbnail} alt={proj.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-text-dark block">{proj.name}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">{proj.aspectRatio} | {proj.resolution}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      {proj.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-panel text-[8px] font-semibold text-gray-500 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{proj.updatedAt}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Copilot Companion & Platform News */}
        <div className="space-y-6">
          {/* AI Assistant Chat Widget */}
          <div className="bg-card border border-border-light rounded-2xl shadow-xs overflow-hidden flex flex-col h-[320px]">
            <div className="p-3 border-b border-border-light bg-panel/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-text-dark">AI Companion</span>
              </div>
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[8px] font-bold font-mono rounded">
                READY
              </span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-normal text-left ${
                    msg.sender === "user" 
                      ? "bg-text-dark text-white rounded-tr-none" 
                      : "bg-panel border border-border-light text-text-dark rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChatMessage} className="p-2 border-t border-border-light bg-panel/20 flex space-x-1.5">
              <input
                type="text"
                placeholder="Ask assistant to automate..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 h-8 px-2 bg-btn-bg border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
              />
              <button 
                type="submit" 
                className="p-1.5 bg-text-dark text-white rounded-lg hover:bg-opacity-90 cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* News & Releases Feed */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-text-dark uppercase tracking-wide px-1">Studio Bulletins</h2>
            <div className="space-y-3">
              {[
                { title: "Stable Release 1.0.0 Online", date: "Jul 03, 2026", desc: "Universal foundation fully provisioned. The multi-track timeline, color scopes, 3D coordinate system, and cloud replication engines are live." },
                { title: "Next Phase: Gemini 2.0 Integration", date: "Jun 28, 2026", desc: "We are preparing native multi-modal video-to-speech rendering models for immediate real-time workflow generations." }
              ].map((bullet, idx) => (
                <div key={idx} className="p-4 bg-card border border-border-light rounded-xl text-left space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-dark">{bullet.title}</span>
                    <span className="text-[9px] font-mono text-gray-400">{bullet.date}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{bullet.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORM ENGINES & TELEMETRY DIAGNOSTICS */}
      <div className="space-y-3 border-t border-border-light pt-6">
        <div className="flex justify-between items-center px-1">
          <div>
            <span className="text-xs font-bold text-purple-600 font-mono tracking-wider block uppercase">PLATFORM ARTIFACT CONTEXT</span>
            <h2 className="text-base font-bold text-text-dark tracking-tight">Active Core Engines & Bus Stream</h2>
          </div>
          <span className="text-xs font-mono bg-panel px-2.5 py-1 border border-border-light rounded-lg text-gray-500">
            Platform Ver. <b className="text-text-dark">2.5.0-alpha</b>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Block 1: Loaded Core Modules */}
          <div className="p-4 bg-card border border-border-light rounded-2xl text-left flex flex-col justify-between h-[230px]">
            <div>
              <div className="flex items-center space-x-2 border-b border-border-light/40 pb-2 mb-3">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-text-dark uppercase tracking-wide">Modular Engines</span>
              </div>
              <div className="space-y-2 overflow-y-auto no-scrollbar max-h-[140px]">
                {modulesList.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-[10px] bg-panel/50 p-1.5 rounded border border-border-light/30">
                    <div>
                      <span className="font-bold text-text-dark block leading-none">{m.displayName}</span>
                      <span className="text-[8px] font-mono text-gray-400">ID: {m.id} | v{m.version}</span>
                    </div>
                    <span className={`px-1 rounded-[4px] text-[8px] font-bold font-mono ${
                      m.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[9px] font-mono text-gray-400 block pt-1 border-t border-border-light/20">Hot-plug state verified</span>
          </div>

          {/* Block 2: Registered Microservices */}
          <div className="p-4 bg-card border border-border-light rounded-2xl text-left flex flex-col justify-between h-[230px]">
            <div>
              <div className="flex items-center space-x-2 border-b border-border-light/40 pb-2 mb-3">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-text-dark uppercase tracking-wide">Service Registry</span>
              </div>
              <div className="space-y-1.5 overflow-y-auto no-scrollbar max-h-[140px]">
                {servicesList.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-panel/50 px-1.5 py-1 rounded border border-border-light/30">
                    <span className="font-bold text-gray-700">{s.serviceName}</span>
                    <span className="text-[8px] font-mono text-green-600 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
                      <span>{s.status.toUpperCase()}</span>
                    </span>
                  </div>
                ))}
                {servicesList.length > 5 && (
                  <div className="text-[8px] text-center text-gray-400 font-mono italic">
                    + {servicesList.length - 5} additional registered services running...
                  </div>
                )}
              </div>
            </div>
            <span className="text-[9px] font-mono text-gray-400 block pt-1 border-t border-border-light/20">All 15 endpoints initialized</span>
          </div>

          {/* Block 3: Real-Time Event Bus Feed */}
          <div className="p-4 bg-card border border-border-light rounded-2xl text-left flex flex-col justify-between h-[230px]">
            <div>
              <div className="flex items-center space-x-2 border-b border-border-light/40 pb-2 mb-3">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-text-dark uppercase tracking-wide">Live Event Bus</span>
              </div>
              <div className="space-y-1.5 overflow-y-auto no-scrollbar max-h-[140px] font-mono text-[9px]">
                {eventHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 italic">No events currently recorded.</div>
                ) : (
                  [...eventHistory].reverse().slice(0, 4).map((evt) => (
                    <div key={evt.id} className="p-1.5 bg-panel/60 border border-border-light/40 rounded">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span className="truncate max-w-[120px]">{evt.type}</span>
                        <span className="text-[7px] text-gray-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between text-[7.5px] text-gray-400">
                        <span>Sender: {evt.sender}</span>
                        <span className="text-blue-500 font-bold">{evt.priority.toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[9px] font-mono text-gray-400 block pt-1 border-t border-border-light/20">Wildcard listeners listening...</span>
          </div>

          {/* Block 4: Universal Command Dispatch Bench */}
          <div className="p-4 bg-card border border-border-light rounded-2xl text-left flex flex-col justify-between h-[230px]">
            <div>
              <div className="flex items-center space-x-2 border-b border-border-light/40 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-text-dark uppercase tracking-wide">Command Dispatch</span>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 block font-semibold uppercase">Trigger command test-bench:</span>
                  <div className="flex space-x-1">
                    <select 
                      value={testCommand} 
                      onChange={(e) => setTestCommand(e.target.value)}
                      className="bg-panel border border-border-light text-[10px] text-text-dark font-mono rounded p-1 flex-1 focus:outline-none"
                    >
                      <option value="system_ping">system_ping</option>
                      <option value="test_render_kickoff">vfx_render_kickoff</option>
                      <option value="refresh_cached_assets">asset_flush</option>
                    </select>
                    <button 
                      onClick={handleTriggerTestCommand}
                      className="bg-text-dark text-white text-[9px] font-bold px-2 rounded hover:bg-opacity-90 cursor-pointer"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-[70px] overflow-y-auto no-scrollbar pt-1">
                  <span className="text-[8px] font-mono text-gray-400 uppercase block">Execution History Logs:</span>
                  {commandHistory.length === 0 ? (
                    <span className="text-[9px] text-gray-400 italic block">No commands dispatched yet.</span>
                  ) : (
                    [...commandHistory].reverse().slice(0, 2).map((cmd) => (
                      <div key={cmd.id} className="text-[8px] font-mono bg-panel px-1.5 py-1 rounded border border-border-light/30 flex justify-between">
                        <span className="text-orange-600 font-semibold">{cmd.name}</span>
                        <span className="text-gray-400">Success: true</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-mono text-gray-400 block pt-1 border-t border-border-light/20">Queue prioritized dynamically</span>
          </div>

        </div>
      </div>

    </div>
  );
}

