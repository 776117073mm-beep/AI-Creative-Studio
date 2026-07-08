import React, { useState, useEffect, useRef } from 'react';
import { Search, Wand2, Command, FileText, Image, Video, Music, Type, Layers, Square, Triangle, Circle, Sun } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon: React.ElementType;
  action?: () => void;
}

const allCommands: CommandItem[] = [
  { id: 'new-project', label: 'New Project', category: 'Project', icon: FileText },
  { id: 'import-media', label: 'Import Media...', description: 'Import images, videos, or audio files', category: 'File', icon: Image },
  { id: 'add-text', label: 'Add Text', description: 'Add a text layer to the canvas', category: 'Create', icon: Type },
  { id: 'add-video', label: 'Add Video', description: 'Add a video clip to the timeline', category: 'Create', icon: Video },
  { id: 'add-audio', label: 'Add Audio', description: 'Add an audio track', category: 'Create', icon: Music },
  { id: 'add-shape', label: 'Add Shape', description: 'Insert a shape', category: 'Create', icon: Square },
  { id: 'add-layers', label: 'Add Layers', description: 'Add multiple layers', category: 'Create', icon: Layers },
  { id: 'add-square', label: 'Add Square', description: 'Insert a square shape', category: 'Create', icon: Square },
  { id: 'add-triangle', label: 'Add Triangle', description: 'Insert a triangle shape', category: 'Create', icon: Triangle },
  { id: 'add-circle', label: 'Add Circle', description: 'Insert a circle shape', category: 'Create', icon: Circle },
  { id: 'render', label: 'Render / Export', description: 'Export your project', category: 'Export', icon: FileText },
  { id: 'generate-subtitles', label: 'Generate Subtitles', description: 'AI-generated subtitles for video', category: 'AI', icon: Wand2 },
  { id: 'remove-background', label: 'Remove Background', description: 'Remove background from selected video/image', category: 'AI', icon: Wand2 },
  { id: 'enhance-colors', label: 'Enhance Colors', description: 'AI color enhancement', category: 'AI', icon: Sun },
];

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'command' | 'ai'>('command');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (query) {
      setMode(query.startsWith('>') ? 'command' : 'ai');
    }
  }, [query]);

  const filteredCommands = allCommands.filter(cmd => {
    const searchLower = (
      query.startsWith('>')
        ? query.slice(1)
        : query
    ).toLowerCase().trim();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = mode === 'command' || query.startsWith('>')
      ? filteredCommands
      : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = items[selectedIndex];
      if (selected?.action) {
        selected.action();
      }
      if (mode === 'ai' && !query.startsWith('>') && query.trim()) {
        handleAIQuery(query);
      }
      onClose();
    }
  };

  const handleAIQuery = (aiQuery: string) => {
    console.log('AI Query:', aiQuery);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-command flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {mode === 'ai' && !query.startsWith('>') ? (
            <Wand2 className="w-5 h-5 text-accent-cyan flex-shrink-0" />
          ) : (
            <Command className="w-5 h-5 text-white/40 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'ai' && !query.startsWith('>')
                ? 'Ask AI anything...'
                : 'Type a command or search...'
            }
            className="flex-1 bg-transparent text-white text-lg focus:outline-none placeholder:text-white/30"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {(mode === 'command' || query.startsWith('>')) && filteredCommands.length > 0 && (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action?.();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-primary-600/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary-600/30 text-primary-400' : 'bg-surface-elevated text-white/60'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {cmd.label}
                      </div>
                      {cmd.description && (
                        <div className="text-xs text-white/40 truncate">{cmd.description}</div>
                      )}
                    </div>
                    <span className="text-xs text-white/30 px-2 py-0.5 bg-surface-elevated rounded">
                      {cmd.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {mode === 'ai' && !query.startsWith('>') && query.trim() && (
            <div className="p-4 border-t border-border">
              <div className="text-sm text-white/50 mb-3 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-accent-cyan" />
                <span>AI will help you with: <span className="text-white">{query}</span></span>
              </div>
              <button
                onClick={() => {
                  handleAIQuery(query);
                  onClose();
                }}
                className="btn btn-primary btn-sm w-full"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Execute with AI
              </button>
            </div>
          )}

          {!query && (
            <div className="p-4 text-center text-sm text-white/40">
              Type a command or use natural language to ask AI
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-elevated/50 text-xs text-white/40">
          <span>Prefix with <kbd className="px-1.5 py-0.5 bg-white/5 rounded">&gt;</kbd> for commands only</span>
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
