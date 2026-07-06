import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Sparkles, 
  Grid, 
  ArrowRight, 
  Check, 
  Star 
} from "lucide-react";

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  creator: string;
  rating: number;
  downloads: string;
  isFree: boolean;
  thumbnail: string;
}

export default function TemplateMarketplace() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [installedIds, setInstalledIds] = useState<string[]>([]);

  const templates: TemplateItem[] = [
    { id: "t1", title: "Cyberpunk Glitch Intros Pack", category: "titles", creator: "Matrix Studios", rating: 4.8, downloads: "1.4k", isFree: true, thumbnail: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=250&q=80" },
    { id: "t2", title: "Warm Film Kodak LUT LUTs", category: "color", creator: "Grade Alchemy", rating: 4.9, downloads: "2.8k", isFree: true, thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=250&q=80" },
    { id: "t3", title: "Liquid Fluid Transitions 4K", category: "transitions", creator: "Liquid VFX", rating: 4.7, downloads: "890", isFree: false, thumbnail: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=250&q=80" },
    { id: "t4", title: "Dynamic Modular lower Thirds", category: "titles", creator: "Text Architect", rating: 4.6, downloads: "1.2k", isFree: true, thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=250&q=80" }
  ];

  const handleInstallSim = (id: string) => {
    setInstalledIds(prev => [...prev, id]);
  };

  const filtered = templates.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">CREATIVE ASSETS MARKETPLACE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Template Marketplace</h1>
        </div>
      </div>

      {/* Filter Categories and search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex items-center space-x-2 bg-panel border border-border-light h-9 px-3 rounded-xl w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search template presets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-text-dark bg-transparent focus:outline-none w-full"
          />
        </div>

        <div className="flex bg-panel border border-border-light p-0.5 rounded-xl">
          {(["all", "titles", "color", "transitions"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                activeCategory === cat 
                  ? "bg-white text-text-dark shadow-xs" 
                  : "text-gray-500 hover:text-text-dark"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 text-gray-300 stroke-1 animate-pulse" />
            <span className="text-xs font-semibold block mt-3">No templates matching indexing parameters</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const isInstalled = installedIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  className="bg-card border border-border-light p-3 rounded-2xl text-left hover:border-gray-400 transition-all flex flex-col justify-between"
                >
                  {/* Aspect Thumbnail banner */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-panel relative border border-border-light/40">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8px] font-mono font-bold bg-white text-text-dark px-1.5 py-0.5 rounded absolute top-2 right-2 border border-border-light">
                      {item.isFree ? "FREE" : "PRO"}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-xs font-bold text-text-dark block truncate" title={item.title}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">by {item.creator}</span>
                  </div>

                  {/* Operational stats row */}
                  <div className="flex justify-between items-center mt-4 border-t border-border-light/40 pt-3">
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                      <span className="flex items-center text-orange-500">
                        <Star className="w-3 h-3 fill-orange-500 mr-0.5" />
                        {item.rating}
                      </span>
                      <span>{item.downloads} installs</span>
                    </div>

                    <button
                      onClick={() => handleInstallSim(item.id)}
                      disabled={isInstalled}
                      className={`px-3 py-1 rounded-xl text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                        isInstalled 
                          ? "bg-green-100 text-green-700 font-bold" 
                          : "bg-text-dark text-white hover:bg-opacity-90"
                      }`}
                    >
                      {isInstalled ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Installed</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
