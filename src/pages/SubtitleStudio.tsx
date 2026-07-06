import { useState } from "react";
import { 
  Languages, 
  Sparkles, 
  Check, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  Globe 
} from "lucide-react";
import { PageId } from "../types";

interface SubtitleStudioProps {
  onNavigate: (page: PageId) => void;
}

export default function SubtitleStudio({ onNavigate }: SubtitleStudioProps) {
  const [captions, setCaptions] = useState([
    { id: "1", text: "Nebula cinematic trailer take one.", start: "00:01", end: "00:04", speaker: "Speaker 1" },
    { id: "2", text: "Launching universal AI Creative platforms.", start: "00:05", end: "00:09", speaker: "Speaker 1" },
    { id: "3", text: "Symphonic background orchestration active.", start: "00:10", end: "00:15", speaker: "Music Track" }
  ]);
  const [selectedLang, setSelectedLang] = useState("en");
  const [editingText, setEditingText] = useState("");
  const [activeCaption, setActiveCaption] = useState<string | null>(null);

  const languages = [
    { code: "en", name: "English (US)" },
    { code: "es", name: "Spanish (ES)" },
    { code: "ja", name: "Japanese (JA)" },
    { code: "fr", name: "French (FR)" }
  ];

  const handleTranslateSim = (langCode: string) => {
    setSelectedLang(langCode);
    if (langCode === "es") {
      setCaptions([
        { id: "1", text: "Tráiler cinemático de Nebula, toma uno.", start: "00:01", end: "00:04", speaker: "Speaker 1" },
        { id: "2", text: "Lanzamiento de plataformas creativas universales de IA.", start: "00:05", end: "00:09", speaker: "Speaker 1" },
        { id: "3", text: "Orquestación de fondo sinfónico activa.", start: "00:10", end: "00:15", speaker: "Music Track" }
      ]);
    } else if (langCode === "ja") {
      setCaptions([
        { id: "1", text: "ネビュラ シネマティック トレーラー、テイク1。", start: "00:01", end: "00:04", speaker: "Speaker 1" },
        { id: "2", text: "ユニバーサルAIクリエイティブプラットフォームの起動。", start: "00:05", end: "00:09", speaker: "Speaker 1" },
        { id: "3", text: "交響的なバックグラウンドオーケストレーションがアクティブです。", start: "00:10", end: "00:15", speaker: "Music Track" }
      ]);
    } else {
      setCaptions([
        { id: "1", text: "Nebula cinematic trailer take one.", start: "00:01", end: "00:04", speaker: "Speaker 1" },
        { id: "2", text: "Launching universal AI Creative platforms.", start: "00:05", end: "00:09", speaker: "Speaker 1" },
        { id: "3", text: "Symphonic background orchestration active.", start: "00:10", end: "00:15", speaker: "Music Track" }
      ]);
    }
  };

  const handleEditCaption = (id: string, text: string) => {
    setCaptions(prev => prev.map(cap => cap.id === id ? { ...cap, text } : cap));
    setActiveCaption(null);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Subtitle & Speech Studio</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-btn-bg border border-border-light text-text-dark text-xs font-semibold rounded-xl hover:border-gray-400 transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Captions timeline list */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Subtitle Sequencer</span>
              <h3 className="text-xs font-bold text-text-dark mt-0.5">Dialogue Transcription Blocks</h3>
            </div>
            
            <button 
              onClick={() => {
                const newCap = {
                  id: "cap_" + Date.now(),
                  text: "New dialogue caption prompt line.",
                  start: "00:16",
                  end: "00:20",
                  speaker: "Speaker 2"
                };
                setCaptions(prev => [...prev, newCap]);
              }}
              className="text-xs font-semibold text-text-dark hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>
          </div>

          {/* Interactive captions boxes */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
            {captions.map((cap) => (
              <div 
                key={cap.id}
                className={`p-3 bg-panel/40 border rounded-xl flex flex-col justify-between hover:border-gray-400 transition-all ${
                  activeCaption === cap.id ? "border-text-dark" : "border-border-light"
                }`}
              >
                <div className="flex justify-between text-[10px] font-mono text-gray-400 border-b border-border-light/40 pb-1.5 mb-2">
                  <span>{cap.speaker} • {cap.start}s - {cap.end}s</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setActiveCaption(cap.id);
                        setEditingText(cap.text);
                      }}
                      className="hover:text-text-dark cursor-pointer flex items-center space-x-0.5"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => setCaptions(prev => prev.filter(c => c.id !== cap.id))}
                      className="hover:text-red-600 text-gray-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeCaption === cap.id ? (
                  <div className="flex space-x-2">
                    <input 
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 bg-btn-bg text-xs p-1.5 border border-border-light rounded-lg focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => handleEditCaption(cap.id, editingText)}
                      className="px-2.5 py-1 bg-text-dark text-white text-[10px] rounded-lg cursor-pointer font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-text-dark leading-relaxed">
                    {cap.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Neural translation triggers */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Translation select */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Multi-Language Translation</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslateSim(lang.code)}
                  className={`p-2.5 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    selectedLang === lang.code 
                      ? "border-text-dark bg-panel shadow-xs" 
                      : "border-border-light bg-btn-bg hover:border-gray-400"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Automated Transcription panel */}
          <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Neural Auto-Captions</span>
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Synthesizes vocal frequencies across raw tracks to automatically compile perfectly matched caption timestamps.
            </p>
            <button 
              onClick={() => alert("Auto captions generated across primary audio tracks. 3 layers added.")}
              className="w-full py-2 bg-purple-700 text-white rounded-xl text-xs font-semibold hover:bg-purple-800 transition-colors shadow-xs cursor-pointer"
            >
              Generate Subtitles Sequence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
