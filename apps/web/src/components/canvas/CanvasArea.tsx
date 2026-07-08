import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, MousePointer } from 'lucide-react';
import { WorkspaceType } from '../workspace/Workspace';

interface CanvasAreaProps {
  workspaceType: WorkspaceType;
}

export function CanvasArea({ workspaceType }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-canvas">
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          className="absolute left-1/2 top-1/2 transition-transform duration-75"
          style={{
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div
            className="bg-white/5 border-2 border-white/10 rounded-lg shadow-2xl"
            style={{
              width: workspaceType === 'audio' ? 800 : 1920,
              height: workspaceType === 'audio' ? 200 : 1080,
            }}
          >
            <canvas
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-layers flex items-center gap-2 bg-surface border border-border rounded-lg px-2 py-1.5 shadow-xl">
        <button
          onClick={() => setTool('select')}
          className={`p-1.5 rounded transition-colors ${
            tool === 'select' ? 'bg-primary-600 text-white' : 'text-white/60 hover:text-white'
          }`}
          title="Select tool (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('pan')}
          className={`p-1.5 rounded transition-colors ${
            tool === 'pan' ? 'bg-primary-600 text-white' : 'text-white/60 hover:text-white'
          }`}
          title="Hand tool (H)"
        >
          <Move className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.25))}
          className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="text-sm text-white/80 min-w-[60px] text-center font-mono">
          {Math.round(zoom * 100)}%
        </div>

        <button
          onClick={() => setZoom(prev => Math.min(5, prev + 0.25))}
          className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={resetView}
          className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
          title="Fit to view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
