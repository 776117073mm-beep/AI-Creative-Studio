import React from 'react';
import {
  Video,
  Image,
  Music,
  Presentation,
  Palette,
  Wand2,
  Film,
  Layers,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Upload,
  Undo,
  Redo,
  Search,
  Sparkles,
  Settings,
  LayoutTemplate,
} from 'lucide-react';
import { WorkspaceType } from './Workspace';

interface TopToolbarProps {
  activeWorkspace: WorkspaceType;
  onWorkspaceChange: (workspace: WorkspaceType) => void;
  onOpenCommandPalette: () => void;
  onOpenAssetBrowser: () => void;
  onToggleAIPanel: () => void;
}

const workspaces: { type: WorkspaceType; label: string; icon: React.ElementType }[] = [
  { type: 'video', label: 'Video', icon: Video },
  { type: 'design', label: 'Design', icon: Palette },
  { type: 'motion', label: 'Motion', icon: Film },
  { type: 'audio', label: 'Audio', icon: Music },
  { type: 'presentation', label: 'Present', icon: Presentation },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'storyboard', label: 'Storyboard', icon: Layers },
];

export function TopToolbar({
  activeWorkspace,
  onWorkspaceChange,
  onOpenCommandPalette,
  onOpenAssetBrowser,
  onToggleAIPanel,
}: TopToolbarProps) {
  return (
    <div className="h-toolbar bg-surface border-b border-border flex items-center px-2 gap-1 z-toolbar">
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-white">AI Studio</span>
      </div>

      <div className="w-px h-6 bg-border mx-2" />

      <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1">
        {workspaces.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onWorkspaceChange(type)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              activeWorkspace === type
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden xl:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-border mx-2" />

      <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-0.5">
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm text-accent-green"
          title="Play"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm"
          title="Stop"
        >
          <Pause className="w-4 h-4" />
        </button>
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm"
          title="Go to start"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => {}}
          className="btn btn-ghost btn-sm"
          title="Go to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <span className="font-mono text-sm text-white/60 px-3 select-none">
        00:00:00:00
      </span>

      <div className="w-px h-6 bg-border mx-2" />

      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated hover:bg-white/5 rounded-lg text-white/50 hover:text-white text-sm transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <span className="hidden md:inline text-white/30 text-xs ml-2 border border-border rounded px-1">
          {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+K
        </span>
      </button>

      <button
        onClick={onToggleAIPanel}
        className="btn btn-ghost btn-sm text-accent-cyan"
        title="AI Assistant"
      >
        <Wand2 className="w-4 h-4" />
      </button>

      <button
        onClick={onOpenAssetBrowser}
        className="btn btn-ghost btn-sm"
        title="Assets"
      >
        <LayoutTemplate className="w-4 h-4" />
      </button>

      <button
        onClick={() => {}}
        className="btn btn-primary btn-sm"
      >
        <Download className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Export</span>
      </button>
    </div>
  );
}
