import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Scissors,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
  color: string;
}

interface Clip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  selected?: boolean;
}

interface TimelinePanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const mockTracks: Track[] = [
  { id: '1', name: 'Video 1', type: 'video', muted: false, locked: false, visible: true, color: '#3b82f6', clips: [
    { id: 'c1', name: 'Clip 1', startTime: 0, endTime: 3, color: '#3b82f6' },
    { id: 'c2', name: 'Clip 2', startTime: 3.5, endTime: 7, color: '#3b82f6' },
  ]},
  { id: '2', name: 'Video 2', type: 'video', muted: false, locked: false, visible: true, color: '#8b5cf6', clips: [
    { id: 'c3', name: 'Overlay', startTime: 5, endTime: 8, color: '#8b5cf6' },
  ]},
  { id: '3', name: 'Audio 1', type: 'audio', muted: true, locked: false, visible: true, color: '#22c55e', clips: [
    { id: 'c4', name: 'Music.mp3', startTime: 0, endTime: 10, color: '#22c55e' },
  ]},
  { id: '4', name: 'Audio 2', type: 'audio', muted: false, locked: false, visible: true, color: '#f59e0b', clips: [
    { id: 'c5', name: 'Voiceover.wav', startTime: 1, endTime: 6, color: '#f59e0b' },
  ]},
];

export function TimelinePanel({ collapsed, onToggleCollapse }: TimelinePanelProps) {
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const timeToX = useCallback((time: number) => {
    const pixelsPerSecond = 100 * zoom;
    return time * pixelsPerSecond - scrollOffset;
  }, [zoom, scrollOffset]);

  const xToTime = useCallback((x: number) => {
    const pixelsPerSecond = 100 * zoom;
    return (x + scrollOffset) / pixelsPerSecond;
  }, [zoom, scrollOffset]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 30);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = timestamp;
        }
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= duration) {
            if (loopEnabled) {
              return 0;
            }
            setIsPlaying(false);
            return duration;
          }
          return next;
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration, loopEnabled]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = x / (100 * zoom);
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  };

  const handleClipClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClips(prev => {
      const next = new Set(prev);
      if (e.shiftKey) {
        if (next.has(clipId)) {
          next.delete(clipId);
        } else {
          next.add(clipId);
        }
      } else {
        next.clear();
        next.add(clipId);
      }
      return next;
    });
  };

  const playheadX = timeToX(currentTime);

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-elevated">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded transition-colors ${
              isPlaying ? 'bg-accent-green/20 text-accent-green' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setCurrentTime(0)}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Go to start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentTime(duration)}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Go to end"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={`p-1.5 rounded transition-colors ${
              loopEnabled ? 'bg-primary-600/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Loop playback"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 font-mono text-sm text-white/80">
          <span>{formatTime(currentTime)}</span>
          <span className="text-white/30">/</span>
          <span className="text-white/50">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`p-1.5 rounded transition-colors ${
              snapEnabled ? 'bg-primary-600/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Snapping"
          >
            <Magnet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-border flex-shrink-0 overflow-y-auto">
          <div className="h-6 bg-surface-elevated border-b border-border" />
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-2 h-10 px-2 border-b border-border bg-surface hover:bg-white/[0.02] transition-colors"
            >
              <button
                onClick={() => setTracks(tracks.map(t =>
                  t.id === track.id ? { ...t, muted: !t.muted } : t
                ))}
                className={`p-1 rounded transition-colors ${
                  track.muted ? 'text-accent-red' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setTracks(tracks.map(t =>
                  t.id === track.id ? { ...t, visible: !t.visible } : t
                ))}
                className={`p-1 rounded transition-colors ${
                  !track.visible ? 'text-white/20' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setTracks(tracks.map(t =>
                  t.id === track.id ? { ...t, locked: !t.locked } : t
                ))}
                className={`p-1 rounded transition-colors ${
                  track.locked ? 'text-accent-orange' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <span className="flex-1 text-xs text-white/70 truncate">{track.name}</span>
            </div>
          ))}
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Track</span>
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-hidden" ref={timelineRef}>
          <div
            className="relative min-w-full"
            style={{ width: `${duration * 100 * zoom}px` }}
            onClick={handleTimelineClick}
          >
            <div className="h-6 bg-surface-elevated border-b border-border sticky top-0 flex">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex flex-col items-center text-xs text-white/40"
                  style={{ left: timeToX(i) }}
                >
                  <span className="mt-1">{formatTime(i)}</span>
                </div>
              ))}
            </div>

            {tracks.map((track) => (
              <div
                key={track.id}
                className="relative h-10 border-b border-border bg-[#0a0a0f] opacity-100"
              >
                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={(e) => handleClipClick(clip.id, e)}
                    className={`absolute top-1 bottom-1 rounded cursor-pointer flex items-center px-2 text-xs text-white transition-all ${
                      selectedClips.has(clip.id) ? 'ring-2 ring-primary-500 brightness-110' : ''
                    }`}
                    style={{
                      left: timeToX(clip.startTime),
                      width: timeToX(clip.endTime) - timeToX(clip.startTime),
                      backgroundColor: clip.color,
                    }}
                  >
                    <span className="truncate">{clip.name}</span>
                  </div>
                ))}
              </div>
            ))}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary-500 pointer-events-none z-10"
              style={{ left: playheadX }}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
