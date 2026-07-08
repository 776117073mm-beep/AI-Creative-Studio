import React, { useState } from 'react';
import {
  FolderOpen,
  Layers,
  Sparkles,
  Timer,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PanelState, PanelType } from './Workspace';
import { AssetPanel } from '../panels/AssetPanel';
import { LayersPanel } from '../panels/LayersPanel';
import { WorkspaceType } from './Workspace';

interface LeftSidebarProps {
  activeWorkspace: WorkspaceType;
  panels: PanelState[];
  onPanelToggle: (panelId: string) => void;
  width: number;
  onResize: (width: number) => void;
}

const panelIcons: Record<PanelType, React.ElementType> = {
  assets: FolderOpen,
  layers: Layers,
  properties: Timer,
  effects: Sparkles,
  animation: Timer,
  audio: Sparkles,
  ai: Sparkles,
  history: Timer,
  export: LayoutTemplate,
  templates: LayoutTemplate,
};

export function LeftSidebar({
  activeWorkspace,
  panels,
  onPanelToggle,
  width,
  onResize,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<PanelType>('assets');
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 48 : width;

  return (
    <div
      className="flex bg-surface border-r border-border transition-all duration-200 flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      <div className="w-12 bg-surface-elevated border-r border-border flex flex-col items-center py-2 gap-1">
        {(['assets', 'layers'] as PanelType[]).map((type, index) => {
          const Icon = panelIcons[type];
          const isActive = !collapsed && activeTab === type;

          return (
            <button
              key={type}
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                }
                setActiveTab(type);
                onPanelToggle(panels[index]?.id || type);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        <div className="flex-1" />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeTab === 'assets' && <AssetPanel />}
          {activeTab === 'layers' && <LayersPanel activeWorkspace={activeWorkspace} />}
        </div>
      )}
    </div>
  );
}
