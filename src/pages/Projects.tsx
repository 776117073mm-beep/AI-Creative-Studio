import React, { useState } from "react";
import { 
  Grid, 
  List, 
  Search, 
  FolderPlus, 
  Plus, 
  MoreVertical, 
  Pin, 
  Trash2, 
  Copy, 
  Archive, 
  ExternalLink,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { PageId, Project } from "../types";

interface ProjectsProps {
  projects: Project[];
  onSelectProject: (proj: Project) => void;
  onNavigate: (page: PageId) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (proj: Project) => void;
  onTogglePinProject: (id: string) => void;
}

export default function Projects({
  projects,
  onSelectProject,
  onNavigate,
  onDeleteProject,
  onDuplicateProject,
  onTogglePinProject
}: ProjectsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortOption, setSortOption] = useState<"updated" | "name" | "fps">("updated");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Folders list mockup
  const [folders, setFolders] = useState([
    { name: "Cinematics", count: 2 },
    { name: "Promos & Ads", count: 1 },
    { name: "3D Loops", count: 2 }
  ]);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, { name: newFolderName, count: 0 }]);
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  // Extract all tags for filtering
  const allTags = ["All", ...Array.from(new Set(projects.flatMap(p => p.tags)))];

  // Filter and sort projects list
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === "All" || p.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "fps") {
        return b.fps - a.fps;
      }
      return 0; // "updated" maintains index or initial ordering
    });

  return (
    <div className="p-6 space-y-6 text-left animate-in fade-in-50 duration-200">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light pb-4">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">FILE REPOSITORY</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Projects Directory</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="px-3.5 py-1.5 bg-btn-bg border border-border-light rounded-xl text-xs font-semibold hover:border-gray-400 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <FolderPlus className="w-4 h-4 text-gray-700" />
            <span>New Folder</span>
          </button>
          
          <button
            onClick={() => onNavigate("new-project")}
            className="px-3.5 py-1.5 bg-text-dark text-white rounded-xl text-xs font-semibold hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Folders mockup cards */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Category Folders</span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {folders.map((folder, fIdx) => (
            <div 
              key={fIdx}
              className="p-3 bg-card border border-border-light rounded-xl hover:border-gray-400 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-text-dark">{folder.name}</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-panel px-1.5 py-0.5 rounded-md">
                {folder.count} files
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-panel/60 p-3 rounded-xl border border-border-light">
        {/* Search & Tag selector */}
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-btn-bg border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
            />
          </div>

          {/* Tags Dropdown */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="h-8 px-2 bg-btn-bg border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
          >
            {allTags.map((tag, idx) => (
              <option key={idx} value={tag}>Tag: {tag}</option>
            ))}
          </select>

          {/* Sort selection */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="h-8 px-2 bg-btn-bg border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
          >
            <option value="updated">Sort: Last Updated</option>
            <option value="name">Sort: Name A-Z</option>
            <option value="fps">Sort: Frame Rate</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-1 border-l border-border-light pl-3 self-end md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg cursor-pointer ${viewMode === "grid" ? "bg-btn-bg border border-border-light text-text-dark shadow-xs" : "text-gray-400"}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg cursor-pointer ${viewMode === "list" ? "bg-btn-bg border border-border-light text-text-dark shadow-xs" : "text-gray-400"}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project list rendering */}
      {filteredProjects.length === 0 ? (
        <div className="py-12 text-center bg-card border border-border-light border-dashed rounded-2xl">
          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <span className="text-xs font-bold text-text-dark block">No projects found</span>
          <span className="text-[10px] text-gray-500 mt-1 block">Adjust your search or filter tags, or create a new file setup.</span>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-card border border-border-light rounded-xl overflow-hidden hover:border-gray-400 transition-all flex flex-col relative group"
            >
              {/* Media preview */}
              <div 
                onClick={() => onSelectProject(proj)}
                className="h-36 bg-gray-100 relative overflow-hidden cursor-pointer"
              >
                <img 
                  src={proj.thumbnail} 
                  alt={proj.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Resolution badge */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/65 text-white text-[9px] font-mono rounded">
                  {proj.resolution}
                </div>

                {proj.pinned && (
                  <div className="absolute top-2 left-2 p-1 bg-white/95 rounded shadow-xs">
                    <Pin className="w-3 h-3 text-text-dark" />
                  </div>
                )}
              </div>

              {/* Title & Actions info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span 
                      onClick={() => onSelectProject(proj)}
                      className="text-xs font-bold text-text-dark block hover:underline cursor-pointer truncate max-w-[80%]"
                    >
                      {proj.name}
                    </span>
                    
                    {/* Floating context controls */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === proj.id ? null : proj.id)}
                        className="p-1 hover:bg-panel rounded-md cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                      </button>

                      {activeDropdown === proj.id && (
                        <div className="absolute right-0 top-6 w-36 bg-btn-bg border border-border-light rounded-lg shadow-lg py-1.5 z-40 text-xs text-text-dark animate-in fade-in-50 duration-100">
                          <button
                            onClick={() => {
                              onTogglePinProject(proj.id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-panel flex items-center space-x-2"
                          >
                            <Pin className="w-3 h-3" />
                            <span>{proj.pinned ? "Unpin File" : "Pin File"}</span>
                          </button>
                          <button
                            onClick={() => {
                              onDuplicateProject(proj);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-panel flex items-center space-x-2"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={() => {
                              alert("Project archived securely in workspace cloud.");
                              setActiveDropdown(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-panel flex items-center space-x-2"
                          >
                            <Archive className="w-3 h-3" />
                            <span>Archive File</span>
                          </button>
                          <div className="border-t border-border-light my-1"></div>
                          <button
                            onClick={() => {
                              onDeleteProject(proj.id);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 mt-2">
                    {proj.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-1.5 py-0.5 bg-panel text-[8px] font-semibold text-gray-500 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-border-light/40 pt-3 text-[10px] text-gray-500 font-mono">
                  <span>Edited: {proj.updatedAt}</span>
                  <button 
                    onClick={() => onSelectProject(proj)}
                    className="text-[10px] text-text-dark font-sans font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
                  >
                    <span>Load</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border-light rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-panel border-b border-border-light text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <th className="py-2.5 px-4 text-left">Project Name</th>
                <th className="py-2.5 px-4 text-left">Resolution</th>
                <th className="py-2.5 px-4 text-left">Framerate</th>
                <th className="py-2.5 px-4 text-left">Edited</th>
                <th className="py-2.5 px-4 text-left">Tags</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((proj) => (
                <tr 
                  key={proj.id}
                  className="border-b border-border-light hover:bg-panel/40 transition-colors text-xs text-text-dark"
                >
                  <td className="py-3 px-4 font-semibold">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-6 rounded overflow-hidden bg-gray-100 border border-border-light">
                        <img src={proj.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <button onClick={() => onSelectProject(proj)} className="hover:underline">{proj.name}</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500">{proj.resolution}</td>
                  <td className="py-3 px-4 font-mono text-gray-500">{proj.fps} fps</td>
                  <td className="py-3 px-4 font-mono text-gray-500">{proj.updatedAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-1">
                      {proj.tags.map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-panel text-[8px] font-semibold text-gray-500 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <button 
                        onClick={() => onSelectProject(proj)}
                        className="p-1 hover:bg-btn-bg rounded border border-border-light"
                        title="Load Project"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Folder Modal dialog */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreateFolder}
            className="bg-btn-bg border border-border-light p-5 rounded-2xl w-80 shadow-xl space-y-4 text-left animate-in zoom-in-95 duration-150"
          >
            <div>
              <h3 className="text-sm font-bold text-text-dark">Create New Folder</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Organize nested AI project timelines and templates.</p>
            </div>
            
            <input
              type="text"
              placeholder="e.g. Social Promos v2"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full h-8 px-2.5 bg-panel border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
              autoFocus
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 border border-border-light text-xs rounded-lg hover:bg-panel cursor-pointer text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-text-dark text-white text-xs rounded-lg hover:bg-opacity-90 cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
