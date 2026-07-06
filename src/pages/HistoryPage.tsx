import { useState } from "react";
import { 
  Clock, 
  History, 
  GitCommit, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Database 
} from "lucide-react";
import { HistoryItem } from "../types";

interface HistoryPageProps {
  projectHistory: HistoryItem[];
  onRevertHistory: (description: string) => void;
}

export default function HistoryPage({ projectHistory, onRevertHistory }: HistoryPageProps) {
  const [revertedId, setRevertedId] = useState<string | null>(null);

  const handleRevertSim = (id: string, desc: string) => {
    setRevertedId(id);
    onRevertHistory(desc);
    setTimeout(() => setRevertedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE SAVE LOGS</span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Project Revision History</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Revision logs */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">History Logs Deck</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Saves Timeline Tracks</h3>
          </div>

          {/* Timeline scroll */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
            {projectHistory.map((item) => {
              const isReverting = revertedId === item.id;
              return (
                <div key={item.id} className="relative pl-6 border-l-2 border-border-light ml-3 text-left">
                  {/* Circle locator */}
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-purple-600 border border-white"></div>
                  
                  <div className="p-3 bg-panel/30 border border-border-light rounded-xl hover:border-gray-400 transition-all flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-text-dark">{item.action}</span>
                      <div className="flex space-x-3 text-[10px] text-gray-400 mt-1 font-mono">
                        <span>Save Code: {item.id}</span>
                        <span>Time: {item.timestamp}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevertSim(item.id, item.action)}
                      disabled={isReverting}
                      className={`px-3 py-1 rounded-xl text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                        isReverting 
                          ? "bg-green-100 text-green-700 font-bold" 
                          : "bg-text-dark text-white hover:bg-opacity-90"
                      }`}
                    >
                      {isReverting ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Reverted</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert Workspace</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Side Card */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Smart Backups System</span>
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              We compile Git-like checkpoint snapshots on every timeline slice or color parameter shift, so you can backtrack your creativity safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
