import React, { useState } from 'react';
import {
  Settings2,
  Sparkles,
  Clock,
  Download,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { PanelState, PanelType } from './Workspace';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { EffectsPanel } from '../panels/EffectsPanel';
import { WorkspaceType } from './Workspace';

interface RightInspectorProps {
  activeWorkspace: WorkspaceType;
  panels: PanelState[];
  onPanelToggle: (panelId: string) => void;
  width: number;
  onResize: (width: number) => void;
}

const panelLabels: Record<PanelType, string> = {
  assets: 'Assets',
  layers: 'Layers',
  properties: 'Properties',
  effects: 'Effects',
  animation: 'Animation',
  audio: 'Audio',
  ai: 'AI',
  history: 'History',
  export: 'Export',
  templates: 'Templates',
};

export function RightInspector({
  activeWorkspace,
  panels,
  onPanelToggle,
  width,
  onResize,
}: RightInspectorProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'effects'>('properties');
  const [collapsed, setCollapsed] = useState(false);

  const inspectorWidth = collapsed ? 48 : width;

  return (
    <div
      className="flex bg-surface border-l border-border transition-all duration-200 flex-shrink-0"
      style={{ width: inspectorWidth }}
    >
      {!collapsed && (
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'text-white border-b-2 border-primary-500'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab('effects')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'effects'
                    ? 'text-white border-b-2 border-primary-500'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Effects
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'properties' && <PropertiesPanel workspaceType={activeWorkspace} />}
              {activeTab === 'effects' && <EffectsPanel />}
            </div>
          </div>
        </div>
      )}

      <div className="w-12 bg-surface-elevated border-l border-border flex flex-col items-center py-2 gap-1">
        <button
          onClick={() => {
            setCollapsed(false);
            setActiveTab('properties');
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            !collapsed && activeTab === 'properties'
              ? 'bg-primary-600/20 text-primary-400'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
          title="Properties"
        >
          <Settings2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setCollapsed(false);
            setActiveTab('effects');
          }}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            !collapsed && activeTab === 'effects'
              ? 'bg-primary-600/20 text-primary-400'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
          title="Effects"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand inspector' : 'Collapse inspector'}
        >
          {collapsed ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
