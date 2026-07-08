import React, { useState } from 'react';
import {
  X,
  Upload,
  FolderPlus,
  FolderOpen,
  Image,
  Video,
  Music,
  FileText,
  Grid3X3,
  List,
  Search,
  ChevronRight,
  Star,
  Clock,
} from 'lucide-react';

interface AssetBrowserProps {
  onClose: () => void;
}

const mockAssets = Array.from({ length: 20 }, (_, i) => ({
  id: i.toString(),
  name: `asset-${i + 1}.${i % 2 === 0 ? 'mp4' : i % 3 === 0 ? 'mp3' : i % 5 === 0 ? 'png' : 'jpg'}`,
  type: i % 2 === 0 ? 'video' : i % 3 === 0 ? 'audio' : 'image',
  size: `${(Math.random() * 100).toFixed(1)} MB`,
  dateAdded: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
}));

const folders = [
  { id: 'all', name: 'All Media', icon: Grid3X3 },
  { id: 'recent', name: 'Recent', icon: Clock },
  { id: 'favorites', name: 'Favorites', icon: Star },
  { id: 'videos', name: 'Videos', icon: Video },
  { id: 'images', name: 'Images', icon: Image },
  { id: 'audio', name: 'Audio', icon: Music },
];

export function AssetBrowser({ onClose }: AssetBrowserProps) {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const typeIcons: Record<string, React.ElementType> = {
    video: Video,
    audio: Music,
    image: Image,
    document: FileText,
  };

  const typeColors: Record<string, string> = {
    video: 'text-accent-orange',
    audio: 'text-accent-green',
    image: 'text-accent-cyan',
    document: 'text-white/60',
  };

  const filteredAssets = mockAssets.filter(asset => {
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedFolder === 'videos') return asset.type === 'video';
    if (selectedFolder === 'images') return asset.type === 'image';
    if (selectedFolder === 'audio') return asset.type === 'audio';
    return true;
  });

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[80vh] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Asset Browser</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-64 bg-surface-elevated border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 border-r border-border flex-shrink-0 overflow-y-auto">
            {folders.map(folder => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{folder.name}</span>
                </button>
              );
            })}

            <div className="px-3 py-2 mt-2 border-t border-border">
              <button className="w-full flex items-center gap-2 px-0 py-1.5 text-white/40 hover:text-white transition-colors">
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm">New Folder</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredAssets.map(asset => {
                  const Icon = typeIcons[asset.type];
                  const isSelected = selectedAssets.has(asset.id);

                  return (
                    <button
                      key={asset.id}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          setSelectedAssets(prev => {
                            const next = new Set(prev);
                            if (next.has(asset.id)) {
                              next.delete(asset.id);
                            } else {
                              next.add(asset.id);
                            }
                            return next;
                          });
                        } else {
                          setSelectedAssets(new Set([asset.id]));
                        }
                      }}
                      onDoubleClick={() => {}}
                      className={`aspect-square bg-surface-elevated rounded-lg overflow-hidden group relative ${
                        isSelected ? 'ring-2 ring-primary-500' : ''
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className={`w-10 h-10 ${typeColors[asset.type]}`} />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">{asset.name}</p>
                        <p className="text-[10px] text-white/40">{asset.size}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAssets.map(asset => {
                  const Icon = typeIcons[asset.type];
                  const isSelected = selectedAssets.has(asset.id);

                  return (
                    <button
                      key={asset.id}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          setSelectedAssets(prev => {
                            const next = new Set(prev);
                            if (next.has(asset.id)) {
                              next.delete(asset.id);
                            } else {
                              next.add(asset.id);
                            }
                            return next;
                          });
                        } else {
                          setSelectedAssets(new Set([asset.id]));
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-primary-600/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${typeColors[asset.type]}`} />
                      <span className="flex-1 text-sm text-white text-left truncate">{asset.name}</span>
                      <span className="text-xs text-white/40">{asset.size}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-elevated">
          <span className="text-sm text-white/60">
            {selectedAssets.size > 0
              ? `${selectedAssets.size} selected`
              : `${filteredAssets.length} assets`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary btn-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
