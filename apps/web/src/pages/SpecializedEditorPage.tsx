import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Image, Music, SlidersHorizontal, Video } from 'lucide-react';

type EditorKind = 'video' | 'audio' | 'design';

const editorCopy: Record<EditorKind, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; tracks: string[] }> = {
  video: {
    title: 'Video & Motion Timeline',
    subtitle: 'Frame-accurate video tracks, motion layers, captions, effects, and export controls are activated for this project.',
    icon: Video,
    tracks: ['Video Track 01', 'Motion Graphics', 'Captions', 'Music Bed'],
  },
  audio: {
    title: 'Audio Wave / Podcast Timeline',
    subtitle: 'Waveform-first editing with dialogue, music, sound effects, markers, and loudness preparation.',
    icon: Music,
    tracks: ['Dialogue Waveform', 'Music Stem', 'SFX Lane', 'Master Bus'],
  },
  design: {
    title: 'Canvas Design & Image Editor',
    subtitle: 'Canvas-based composition for images, layouts, brand assets, and presentation graphics.',
    icon: Image,
    tracks: ['Canvas Layer', 'Typography', 'Image Stack', 'Brand Overlays'],
  },
};

function getEditorKind(pathname: string): EditorKind {
  if (pathname.includes('/editor/audio')) return 'audio';
  if (pathname.includes('/editor/design')) return 'design';
  return 'video';
}

export function SpecializedEditorPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const kind = getEditorKind(location.pathname);
  const copy = editorCopy[kind];
  const Icon = copy.icon;
  const projectId = params.get('projectId') ?? 'new';
  const projectType = params.get('type') ?? kind;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-black to-zinc-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 shadow-lg shadow-purple-950/30">
                  <Icon className="h-8 w-8 text-purple-200" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-200/80">
                    Specialized route · {projectType}
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">{copy.subtitle}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-white/60">
                Project ID: <span className="text-white">{projectId}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="mb-5 flex items-center gap-2 text-white/70">
                <SlidersHorizontal className="h-5 w-5 text-purple-300" />
                <span className="text-sm font-semibold uppercase tracking-wide">Activated workspace lanes</span>
              </div>
              <div className="space-y-3">
                {copy.tracks.map((track, index) => (
                  <div key={track} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-200">
                      {index + 1}
                    </span>
                    <div className="h-8 flex-1 rounded-lg bg-gradient-to-r from-purple-500/20 via-cyan-500/10 to-transparent" />
                    <span className="min-w-32 text-sm text-white/70">{track}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <h2 className="text-lg font-semibold">Routing confirmed</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Dashboard project cards now route by creative type: video and motion land here, audio opens a waveform/podcast layout, and image/design projects open a canvas editor route.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
