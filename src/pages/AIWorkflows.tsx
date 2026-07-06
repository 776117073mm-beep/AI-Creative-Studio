import React, { useState } from "react";
import { 
  Workflow, 
  Plus, 
  Play, 
  Trash2, 
  Sparkles, 
  Check, 
  Heart,
  ChevronRight,
  Database
} from "lucide-react";
import { SavedWorkflow } from "../types";

interface AIWorkflowsProps {
  workflows: SavedWorkflow[];
  onToggleFavorite: (id: string) => void;
  onRunWorkflow: (name: string) => void;
  onAddWorkflow: (flow: SavedWorkflow) => void;
}

export default function AIWorkflows({
  workflows,
  onToggleFavorite,
  onRunWorkflow,
  onAddWorkflow
}: AIWorkflowsProps) {
  const [activeChain, setActiveChain] = useState<string>("w1");
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddWorkflow({
      id: "w_" + Date.now(),
      name,
      description: desc,
      nodesCount: 4,
      lastUsed: "Just created",
      isFavorite: false
    });

    setName("");
    setDesc("");
    setShowAddModal(false);
  };

  // Mock node structure based on selected chain ID
  const getNodeChain = (id: string) => {
    if (id === "w1") {
      return [
        { title: "Vocal Extract Layer", desc: "Isolate primary speech from overlapping background tracks." },
        { title: "Voice De-noise Engine", desc: "Remove fan and air hum frequencies (threshold -24dB)." },
        { title: "Speech to Text Neural", desc: "Transcribes speech with 99.4% accuracy matrix." },
        { title: "Translate to Japanese / Spanish", desc: "Direct subtitle overlay compilation." }
      ];
    } else if (id === "w2") {
      return [
        { title: "B-Roll Subject Detector", desc: "Analyzes primary speaker topics for semantic objects." },
        { title: "Stock Library Scan", desc: "Extract related visual images & landscapes matching speech." },
        { title: "Auto-insert Broll Clip", desc: "Pipes selected clips directly into Video track 2." },
        { title: "Match Ambient LUT Color", desc: "Blends shadows and exposure variables to primary video." }
      ];
    }
    return [
      { title: "Raw Audio Ingestion", desc: "Pre-amp signal compression standardizer." },
      { title: "Multiband Compressor", desc: "Auto-balances dialogues thresholds." },
      { title: "Render Stereo WAV output", desc: "Pipes direct to Render queue." }
    ];
  };

  const currentNodes = getNodeChain(activeChain);

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Upper headers */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">AUTOMATION SYSTEM</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">AI Workflows Automation</h1>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-text-dark text-white rounded-xl text-xs font-semibold hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow Chain</span>
        </button>
      </div>

      {/* Main splits: List on left, Visual Chain Builder diagram on right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        {/* Workflows list */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto no-scrollbar">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Saved Chains</span>
          <div className="space-y-2">
            {workflows.map((flow) => {
              const isActive = activeChain === flow.id;
              return (
                <div
                  key={flow.id}
                  onClick={() => setActiveChain(flow.id)}
                  className={`p-4 bg-card border rounded-xl hover:border-gray-400 transition-all text-left relative cursor-pointer group flex flex-col justify-between ${
                    isActive ? "border-text-dark shadow-xs" : "border-border-light"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-text-dark block hover:underline truncate max-w-[80%]">
                        {flow.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(flow.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${flow.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">{flow.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-4 border-t border-border-light/40 pt-3 text-[9px] font-mono text-gray-400">
                    <span>{flow.nodesCount} neural steps</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunWorkflow(flow.name);
                      }}
                      className="px-2.5 py-1 bg-text-dark text-white rounded-lg text-[9px] font-mono hover:bg-opacity-90 flex items-center space-x-1 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Execute</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Flow diagram on right */}
        <div className="lg:col-span-2 bg-panel border border-border-light rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative">
          
          {/* Header */}
          <div className="border-b border-border-light pb-2 shrink-0 text-left">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider font-mono">Visual Node Chain Canvas</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Automated Node Flow</h3>
          </div>

          {/* Interactive Nodes layout */}
          <div className="flex-1 overflow-y-auto py-6 px-10 space-y-4 no-scrollbar relative min-h-0 flex flex-col items-center">
            
            {/* Start capsule */}
            <div className="px-4 py-1.5 bg-text-dark text-white text-[10px] font-mono rounded-full shrink-0 border border-transparent shadow-md">
              [TRIGGER: MEDIA CLIPS IMPORTED]
            </div>

            {/* Connecting flow lines and sequential cards */}
            {currentNodes.map((node, idx) => (
              <div key={idx} className="flex flex-col items-center w-full max-w-sm shrink-0">
                {/* Connecting arrow indicator line */}
                <div className="h-6 w-0.5 bg-gray-300 relative">
                  <div className="absolute bottom-0 -left-1 text-gray-300 text-[10px] font-bold font-mono">▼</div>
                </div>

                {/* Node Box */}
                <div className="w-full p-3 bg-btn-bg border border-border-light rounded-xl hover:border-purple-300 transition-colors shadow-xs text-left relative group">
                  <div className="absolute top-3 right-3 text-purple-500 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-text-dark block">
                    Step {idx + 1}: {node.title}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{node.desc}</p>
                </div>
              </div>
            ))}

            {/* End capsule */}
            <div className="flex flex-col items-center w-full max-w-sm shrink-0">
              <div className="h-6 w-0.5 bg-gray-300 relative">
                <div className="absolute bottom-0 -left-1 text-gray-300 text-[10px] font-bold font-mono">▼</div>
              </div>
              <div className="px-4 py-1.5 bg-green-700 text-white text-[10px] font-mono rounded-full shrink-0 shadow-md">
                [OUTPUT: DIRECT TO RENDER PRESETS]
              </div>
            </div>
          </div>

          {/* Canvas action bar */}
          <div className="border-t border-border-light/60 pt-3 flex justify-between items-center shrink-0">
            <span className="text-[9px] font-mono text-gray-400">Database synchronization active</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 border border-border-light hover:border-gray-400 rounded-xl text-xs font-bold text-gray-600 hover:text-text-dark cursor-pointer">
                Validate Nodes
              </button>
              <button 
                onClick={() => onRunWorkflow(workflows.find(w => w.id === activeChain)?.name || "Workflow")}
                className="px-3.5 py-1.5 bg-text-dark hover:bg-opacity-90 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Automation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Workflow Modal popup dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreateWorkflow}
            className="bg-btn-bg border border-border-light p-5 rounded-2xl w-96 shadow-xl space-y-4 text-left animate-in zoom-in-95 duration-150"
          >
            <div>
              <h3 className="text-sm font-bold text-text-dark">Construct New Automation Chain</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Map sequential API model operations on imported video/audio clips.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-dark">Workflow Name</label>
              <input
                type="text"
                placeholder="e.g. Social Reels Auto-Cutter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-8 px-2.5 bg-panel border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-dark">Description Summary</label>
              <textarea
                placeholder="Describe what automated neural tasks this chain runs..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full h-16 p-2 bg-panel border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-border-light text-xs rounded-lg hover:bg-panel cursor-pointer text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-text-dark text-white text-xs rounded-lg hover:bg-opacity-90 cursor-pointer"
              >
                Create Chain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
