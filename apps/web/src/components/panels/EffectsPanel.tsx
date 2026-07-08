import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  MoreHorizontal,
  Settings,
} from 'lucide-react';

interface Effect {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings?: Record<string, number | string | boolean>;
}

const mockEffects: Effect[] = [
  {
    id: '1',
    name: 'Blur',
    type: 'blur',
    enabled: true,
    settings: { radius: 5 },
  },
  {
    id: '2',
    name: 'Color Correction',
    type: 'color',
    enabled: true,
    settings: { brightness: 10, contrast: 20, saturation: 100 },
  },
  {
    id: '3',
    name: 'Drop Shadow',
    type: 'shadow',
    enabled: false,
    settings: { offsetX: 3, offsetY: 3, blur: 5, opacity: 50 },
  },
];

const availableEffects = [
  { id: 'blur', name: 'Blur', category: 'Stylize' },
  { id: 'brightness', name: 'Brightness/Contrast', category: 'Color' },
  { id: 'saturation', name: 'Saturation', category: 'Color' },
  { id: 'curves', name: 'Curves', category: 'Color' },
  { id: 'levels', name: 'Levels', category: 'Color' },
  { id: 'sharpen', name: 'Sharpen', category: 'Stylize' },
  { id: 'noise', name: 'Noise', category: 'Stylize' },
  { id: 'vignette', name: 'Vignette', category: 'Stylize' },
  { id: 'glitch', name: 'Glitch', category: 'Distort' },
  { id: 'warp', name: 'Warp', category: 'Distort' },
];

export function EffectsPanel() {
  const [effects, setEffects] = useState<Effect[]>(mockEffects);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEffectsLibrary, setShowEffectsLibrary] = useState(false);
  const [expandedEffects, setExpandedEffects] = useState<Set<string>>(new Set(['1', '2']));

  const filteredEffects = availableEffects.filter(effect =>
    effect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    effect.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEffect = (effectId: string) => {
    setEffects(prev =>
      prev.map(e =>
        e.id === effectId ? { ...e, enabled: !e.enabled } : e
      )
    );
  };

  const toggleExpanded = (effectId: string) => {
    setExpandedEffects(prev => {
      const next = new Set(prev);
      if (next.has(effectId)) {
        next.delete(effectId);
      } else {
        next.add(effectId);
      }
      return next;
    });
  };

  const removeEffect = (effectId: string) => {
    setEffects(prev => prev.filter(e => e.id !== effectId));
  };

  const addEffect = (effectType: string, effectName: string) => {
    const newEffect: Effect = {
      id: Date.now().toString(),
      name: effectName,
      type: effectType,
      enabled: true,
    };
    setEffects(prev => [...prev, newEffect]);
    setShowEffectsLibrary(false);
  };

  const effectsByCategory = filteredEffects.reduce((acc, effect) => {
    if (!acc[effect.category]) {
      acc[effect.category] = [];
    }
    acc[effect.category].push(effect);
    return acc;
  }, {} as Record<string, typeof availableEffects>);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Effects</span>
        <button
          onClick={() => setShowEffectsLibrary(!showEffectsLibrary)}
          className="p-1 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showEffectsLibrary && (
        <div className="border-b border-border">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search effects..."
                className="w-full bg-surface-elevated border border-border rounded px-2 py-1.5 pl-7 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto px-2 pb-2">
            {Object.entries(effectsByCategory).map(([category, categoryEffects]) => (
              <div key={category} className="mb-2">
                <div className="text-[10px] text-white/40 uppercase tracking-wide px-1 mb-1">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {categoryEffects.map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => addEffect(effect.id, effect.name)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                      <span className="text-xs text-white/80">{effect.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {effects.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/40">
            No effects applied.
            <br />
            Click + to add effects.
          </div>
        ) : (
          effects.map((effect) => (
            <div key={effect.id} className="border-b border-border">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => toggleExpanded(effect.id)}
                  className="text-white/60"
                >
                  {expandedEffects.has(effect.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="checkbox"
                  checked={effect.enabled}
                  onChange={() => toggleEffect(effect.id)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary-500"
                />

                <span className={`flex-1 text-xs ${effect.enabled ? 'text-white/80' : 'text-white/40'}`}>
                  {effect.name}
                </span>

                <button
                  onClick={() => removeEffect(effect.id)}
                  className="p-1 rounded text-white/40 hover:text-accent-red transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedEffects.has(effect.id) && effect.settings && (
                <div className="px-6 pb-2 space-y-2">
                  {Object.entries(effect.settings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/60 capitalize">{key}</span>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={String(value)}
                        className="w-16 bg-surface-elevated border border-border rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
