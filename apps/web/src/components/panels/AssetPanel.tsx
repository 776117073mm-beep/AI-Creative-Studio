import React, { useState } from 'react';
import {
  FolderOpen,
  Image,
  Video,
  Music,
  FileText,
  Upload,
  FolderPlus,
  Grid3X3,
  List,
  Search,
  MoreHorizontal,
  Trash2,
  Download,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  thumbnail?: string;
  size: string;
  duration?: string;
  dateAdded: Date;
}

const mockAssets: Asset[] = [
  { id: '1', name: 'intro-video.mp4', type: 'video', size: '45.2 MB', duration: '0:32', dateAdded: new Date() },
  { id: '2', name: 'hero-background.jpg', type: 'image', size: '2.1 MB', dateAdded: new Date() },
  { id: '3', name: 'background-music.mp3', type: 'audio', size: '4.8 MB', duration: '3:45', dateAdded: new Date() },
  { id: '4', name: 'logo-transparent.png', type: 'image', size: '156 KB', dateAdded: new Date() },
  { id: '5', name: 'b-roll-1.mp4', type: 'video', size: '120 MB', duration: '1:20', dateAdded: new Date() },
  { id: '6', name: 'voiceover.wav', type: 'audio', size: '32 MB', duration: '2:10', dateAdded: new Date() },
];

const typeIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
};

const typeColors = {
  image: 'text-accent-cyan',
  video: 'text-accent-orange',
  audio: 'text-accent-green',
  document: 'text-white/60',
};

export function AssetPanel() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newAssets: Asset[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'document',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      dateAdded: new Date(),
    }));
    setAssets(prev => [...prev, ...newAssets]);
  };

  const handleAssetClick = (assetId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedAssets(prev => {
        const next = new Set(prev);
        if (next.has(assetId)) {
          next.delete(assetId);
        } else {
          next.add(assetId);
        }
        return next;
      });
    } else {
      setSelectedAssets(new Set([assetId]));
    }
  };

  return (
    <div className="h-full flex flex-col panel">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-surface-elevated border border-border rounded px-2 py-1.5 pl-8 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1 mt-2">
          {(['video', 'image', 'audio'] as const).map(type => {
            const Icon = typeIcons[type];
            const count = assets.filter(a => a.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  selectedType === type
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type}</span>
                <span className="text-white/40">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-2 ${dragOver ? 'bg-primary-600/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-600/10 border-2 border-dashed border-primary-500 rounded-lg">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto text-primary-400" />
              <p className="mt-2 text-sm text-primary-400">Drop files here</p>
            </div>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map(asset => {
              const Icon = typeIcons[asset.type];
              return (
                <button
                  key={asset.id}
                  onClick={(e) => handleAssetClick(asset.id, e)}
                  onDoubleClick={() => {}}
                  className={`aspect-square bg-surface-elevated rounded-lg overflow-hidden group relative ${
                    selectedAssets.has(asset.id) ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-8 h-8 ${typeColors[asset.type]}`} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">{asset.name}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAssets.map(asset => {
              const Icon = typeIcons[asset.type];
              return (
                <button
                  key={asset.id}
                  onClick={(e) => handleAssetClick(asset.id, e)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left ${
                    selectedAssets.has(asset.id)
                      ? 'bg-primary-600/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${typeColors[asset.type]}`} />
                  <span className="flex-1 text-xs text-white truncate">{asset.name}</span>
                  <span className="text-xs text-white/40">{asset.size}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-border flex items-center gap-1">
        <button
          className="flex-1 btn btn-secondary btn-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
        <button
          className="p-2 btn btn-ghost btn-sm"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
