import React, { useState } from 'react';
import {
  Video,
  Music,
  Type,
  Image,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { WorkspaceType } from '../workspace/Workspace';

interface Layer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'group';
  locked: boolean;
  visible: boolean;
  muted: boolean;
  children?: string[];
  parentId?: string;
}

const mockLayers: Layer[] = [
  {
    id: '1',
    name: 'Title Text',
    type: 'text',
    locked: false,
    visible: true,
    muted: false,
  },
  {
    id: '2',
    name: 'Main Video',
    type: 'video',
    locked: false,
    visible: true,
    muted: false,
  },
  {
    id: '3',
    name: 'Overlay',
    type: 'image',
    locked: false,
    visible: true,
    muted: false,
  },
  {
    id: '4',
    name: 'Background Music',
    type: 'audio',
    locked: false,
    visible: true,
    muted: false,
  },
  {
    id: '5',
    name: 'Voiceover',
    type: 'audio',
    locked: true,
    visible: true,
    muted: true,
  },
];

const typeIcons = {
  video: Video,
  audio: Music,
  text: Type,
  image: Image,
  group: ChevronDown,
};

const typeColors = {
  video: 'text-accent-orange',
  audio: 'text-accent-green',
  text: 'text-accent-cyan',
  image: 'text-accent-blue',
  group: 'text-white/60',
};

interface LayersPanelProps {
  activeWorkspace: WorkspaceType;
}

export function LayersPanel({ activeWorkspace }: LayersPanelProps) {
  const [layers, setLayers] = useState<Layer[]>(mockLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev =>
      prev.map(l =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      )
    );
  };

  const toggleLayerLock = (layerId: string) => {
    setLayers(prev =>
      prev.map(l =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      )
    );
  };

  const toggleLayerMute = (layerId: string) => {
    setLayers(prev =>
      prev.map(l =>
        l.id === layerId ? { ...l, muted: !l.muted } : l
      )
    );
  };

  const moveLayerUp = (layerId: string) => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index === 0) return;
    const newLayers = [...layers];
    [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
    setLayers(newLayers);
  };

  const moveLayerDown = (layerId: string) => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index === layers.length - 1) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    setLayers(newLayers);
  };

  const deleteLayer = (layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  return (
    <div className="h-full flex flex-col panel">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Layers</span>
        <span className="text-xs text-white/40">{layers.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer) => {
          const Icon = typeIcons[layer.type];
          const isSelected = selectedLayerId === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary-600/20'
                  : 'hover:bg-white/5'
              } ${!layer.visible ? 'opacity-50' : ''}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className={`p-1 rounded transition-colors ${
                  layer.visible
                    ? 'text-white/60 hover:text-white'
                    : 'text-white/20'
                }`}
              >
                {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <Icon className={`w-4 h-4 flex-shrink-0 ${typeColors[layer.type]}`} />

              <span className={`flex-1 text-xs truncate ${
                layer.locked ? 'text-white/40' : 'text-white/80'
              }`}>
                {layer.name}
              </span>

              {(layer.type === 'audio' || layer.type === 'video') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerMute(layer.id);
                  }}
                  className={`p-1 rounded transition-colors ${
                    layer.muted
                      ? 'text-accent-red'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {layer.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className={`p-1 rounded transition-colors ${
                  layer.locked
                    ? 'text-accent-orange'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {selectedLayerId && (
        <div className="px-3 py-2 border-t border-border flex items-center gap-1">
          <button
            onClick={() => moveLayerUp(selectedLayerId)}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Move up"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => moveLayerDown(selectedLayerId)}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => {}}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteLayer(selectedLayerId)}
            className="p-1.5 rounded text-white/40 hover:text-accent-red hover:bg-white/5 transition-colors ml-auto"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
