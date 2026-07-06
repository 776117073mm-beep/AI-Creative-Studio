import { useState } from "react";
import { 
  File, 
  FolderPlus, 
  Search, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Music,
  Maximize2
} from "lucide-react";
import { MediaAsset } from "../types";

interface AssetManagerProps {
  mediaLibrary: MediaAsset[];
  onUploadMedia: (file: MediaAsset) => void;
  onDeleteMedia: (id: string) => void;
}

export default function AssetManager({
  mediaLibrary,
  onUploadMedia,
  onDeleteMedia
}: AssetManagerProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "audio" | "image">("all");
  const [isGrid, setIsGrid] = useState(true);

  const filtered = mediaLibrary.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleUploadSim = () => {
    const newMedia: MediaAsset = {
      id: "media_" + Date.now(),
      name: "Drone_Horizon_Vocal.wav",
      type: "audio",
      size: "8.2 MB",
      thumbnail: "",
      resolution: "Stereo 48kHz",
      duration: "0:45",
      addedAt: "Just uploaded"
    };
    onUploadMedia(newMedia);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">ASSET SYSTEM STORAGE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Media Asset Hub</h1>
        </div>

        <button
          onClick={handleUploadSim}
          className="px-3.5 py-1.5 bg-text-dark hover:bg-opacity-90 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload File Assets</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex items-center space-x-2 bg-panel border border-border-light h-9 px-3 rounded-xl w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search assets index..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-text-dark bg-transparent focus:outline-none w-full"
          />
        </div>

        <div className="flex justify-between items-center w-full sm:w-auto gap-3">
          {/* Format filter tabs */}
          <div className="flex bg-panel border border-border-light p-0.5 rounded-xl">
            {(["all", "video", "audio", "image"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                  filterType === t 
                    ? "bg-white text-text-dark shadow-xs" 
                    : "text-gray-500 hover:text-text-dark"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Grid list switches */}
          <div className="flex bg-panel border border-border-light p-0.5 rounded-xl">
            <button 
              onClick={() => setIsGrid(true)} 
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isGrid ? "bg-white text-text-dark shadow-xs" : "text-gray-400"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsGrid(false)} 
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${!isGrid ? "bg-white text-text-dark shadow-xs" : "text-gray-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main assets list */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <File className="w-10 h-10 text-gray-300 stroke-1 animate-pulse" />
            <span className="text-xs font-semibold block mt-3">No assets found matching index</span>
          </div>
        ) : isGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((asset) => (
              <div 
                key={asset.id} 
                className="bg-card border border-border-light p-2.5 rounded-xl text-left hover:border-gray-400 transition-all group relative flex flex-col justify-between"
              >
                {/* Visual Thumbnail */}
                <div className="aspect-video w-full bg-panel rounded-lg overflow-hidden relative flex items-center justify-center border border-border-light/40">
                  {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : asset.type === "video" ? (
                    <Video className="w-6 h-6 text-gray-400" />
                  ) : asset.type === "audio" ? (
                    <Music className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}

                  <span className="text-[8px] font-mono font-bold bg-black/60 text-white px-1 py-0.5 rounded absolute bottom-1 right-1">
                    {asset.duration || asset.size}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-bold text-text-dark block truncate hover:underline" title={asset.name}>
                    {asset.name}
                  </span>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 mt-1 font-mono">
                    <span>{asset.resolution || asset.size}</span>
                    <button
                      onClick={() => onDeleteMedia(asset.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border-light bg-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-dark">
                <thead className="bg-panel border-b border-border-light text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="p-3">File Asset Name</th>
                    <th className="p-3">Format Type</th>
                    <th className="p-3">Dimensions / Channels</th>
                    <th className="p-3">File Size</th>
                    <th className="p-3 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/40">
                  {filtered.map((asset) => (
                    <tr key={asset.id} className="hover:bg-panel/40">
                      <td className="p-3 font-semibold">{asset.name}</td>
                      <td className="p-3 font-mono text-[10px] capitalize text-gray-500">{asset.type}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">{asset.resolution || "Stereo Mix"}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">{asset.size}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onDeleteMedia(asset.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
