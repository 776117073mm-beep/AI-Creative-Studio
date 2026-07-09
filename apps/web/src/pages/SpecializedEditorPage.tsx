import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  Clapperboard,
  Image,
  Layers3,
  Mic2,
  Music,
  Play,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Video,
  Wand2,
} from 'lucide-react';

type EditorKind = 'video' | 'audio' | 'design';

const editorCopy: Record<EditorKind, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  video: {
    title: 'Video & Motion Engine',
    subtitle: 'CapCut and Runway-inspired dual-pane video workspace with AI effects, speed controls, and a multi-track timeline.',
    icon: Video,
    accent: 'from-purple-500 to-cyan-400',
  },
  audio: {
    title: 'Audio Wave / Podcast Engine',
    subtitle: 'ElevenLabs-inspired audio production with waveform editing, voice generation, cleanup, and mastering controls.',
    icon: Music,
    accent: 'from-emerald-400 to-cyan-400',
  },
  design: {
    title: 'Image & Design Canvas Engine',
    subtitle: 'A focused canvas editor with layer management, prompt manipulation, and layout controls for images and brand assets.',
    icon: Image,
    accent: 'from-fuchsia-500 to-sky-400',
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_8%,rgba(88,28,135,0.42),transparent_30%),linear-gradient(180deg,#09090b,#020203)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col p-3 sm:p-5">
        <header className="mb-4 rounded-[28px] border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="rounded-2xl border border-white/10 bg-white/7 p-3 text-white/65 transition hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className={`rounded-2xl bg-gradient-to-br ${copy.accent} p-3 shadow-lg shadow-black/30`}><Icon className="h-6 w-6" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">{projectType} · Project {projectId}</p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-white/55">{copy.subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/65 transition hover:text-white">Assets</button>
              <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/65 transition hover:text-white">Properties</button>
              <button className="rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-2 text-sm font-bold shadow-lg shadow-purple-950/40">Export</button>
            </div>
          </div>
        </header>

        <main className={`grid flex-1 min-h-0 gap-4 ${leftPanelOpen && rightPanelOpen ? 'xl:grid-cols-[260px_1fr_320px]' : leftPanelOpen ? 'xl:grid-cols-[260px_1fr]' : rightPanelOpen ? 'xl:grid-cols-[1fr_320px]' : 'xl:grid-cols-1'}`}>
          {leftPanelOpen && <AssetDock kind={kind} />}
          {kind === 'video' && <VideoMotionWorkspace />}
          {kind === 'audio' && <AudioWorkspace />}
          {kind === 'design' && <DesignWorkspace />}
          {rightPanelOpen && <PropertyDock kind={kind} />}
        </main>
      </div>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-white/10 bg-zinc-950/55 shadow-xl shadow-black/30 backdrop-blur-2xl ${className}`}>{children}</section>;
}

function AssetDock({ kind }: { kind: EditorKind }) {
  const assets = kind === 'audio' ? ['Voiceover.wav', 'Intro Music.mp3', 'Room Tone.aif'] : kind === 'design' ? ['Hero Image.png', 'Logo Mark.svg', 'Brand Texture.jpg'] : ['A-roll.mp4', 'B-roll.mov', 'Captions.srt'];
  return (
    <Panel className="hidden min-h-0 p-4 xl:block">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Asset Library</h2>
        <Upload className="h-4 w-4 text-white/40" />
      </div>
      <div className="space-y-3">
        {assets.map(asset => <div key={asset} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{asset}</div>)}
      </div>
    </Panel>
  );
}

function VideoMotionWorkspace() {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Panel className="min-h-[420px] overflow-hidden p-4">
        <div className="grid h-full gap-4 lg:grid-cols-[1fr_240px]">
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.28),transparent_32%),linear-gradient(135deg,#111827,#020617)]">
            <div className="absolute inset-10 rounded-[32px] border border-white/10 bg-black/20 shadow-2xl shadow-purple-950/30" />
            <button className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition hover:scale-105"><Play className="ml-1 h-9 w-9" /></button>
            <span className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/60">HTML5 Preview Canvas · 60 FPS</span>
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-4">
            <h3 className="font-bold">Context Controls</h3>
            {['Speed 1.00x', 'AI Stabilize', 'Cinematic LUT', 'Auto Captions'].map(item => <div key={item} className="rounded-2xl bg-white/[0.04] p-3 text-sm text-white/65">{item}</div>)}
          </div>
        </div>
      </Panel>
      <TimelineDock lanes={['Video Track', 'Motion FX', 'Captions', 'Music Bed']} />
    </div>
  );
}

function AudioWorkspace() {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Panel className="min-h-[420px] p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Waveform Editor</h2><Mic2 className="h-5 w-5 text-emerald-300" /></div>
        <div className="flex h-64 items-center gap-1 overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-5">
          {Array.from({ length: 96 }).map((_, index) => <div key={index} className="w-full rounded-full bg-gradient-to-t from-emerald-500 to-cyan-300" style={{ height: `${20 + Math.abs(Math.sin(index * 0.42)) * 78}%` }} />)}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Voice: Sarah Neural', 'Cleanup: Studio', 'Master: -14 LUFS'].map(item => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">{item}</div>)}
        </div>
      </Panel>
      <TimelineDock lanes={['Dialogue', 'Music Stem', 'SFX', 'Master Bus']} />
    </div>
  );
}

function DesignWorkspace() {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Panel className="min-h-[520px] p-5">
        <div className="grid h-full gap-4 lg:grid-cols-[1fr_240px]">
          <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,0.04)_25%,transparent_25%)] bg-[size:32px_32px]">
            <div className="aspect-[4/5] w-64 rounded-[32px] border border-white/15 bg-gradient-to-br from-fuchsia-500/40 via-sky-500/25 to-zinc-950 p-5 shadow-2xl shadow-fuchsia-950/30">
              <div className="h-full rounded-[24px] border border-white/15 bg-black/25 p-5"><Sparkles className="mb-20 h-8 w-8 text-white" /><p className="text-2xl font-black">AI Campaign Visual</p></div>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 p-4">
            <h3 className="font-bold">Layer Manager</h3>
            {['Hero subject', 'Prompt overlay', 'Brand logo', 'Gradient background'].map(item => <div key={item} className="rounded-2xl bg-white/[0.04] p-3 text-sm text-white/65"><Layers3 className="mr-2 inline h-4 w-4" />{item}</div>)}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TimelineDock({ lanes }: { lanes: string[] }) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center gap-2 text-white/70"><Clapperboard className="h-5 w-5 text-purple-300" /><span className="font-bold">Multi-track Timeline</span></div>
      <div className="space-y-2">
        {lanes.map((lane, index) => <div key={lane} className="grid grid-cols-[120px_1fr] items-center gap-3"><span className="text-xs text-white/45">{lane}</span><div className="h-9 rounded-xl border border-white/10 bg-white/[0.03]"><div className="h-full rounded-xl bg-gradient-to-r from-purple-500/35 to-cyan-400/20" style={{ width: `${52 + index * 10}%` }} /></div></div>)}
      </div>
    </Panel>
  );
}

function PropertyDock({ kind }: { kind: EditorKind }) {
  const labels = kind === 'audio' ? ['Voice model', 'Noise floor', 'Compression', 'Loudness'] : kind === 'design' ? ['Prompt strength', 'Layout grid', 'Brand kit', 'Generative fill'] : ['Speed', 'AI effects', 'Color LUT', 'Tracking'];
  return (
    <Panel className="hidden min-h-0 p-4 xl:block">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Properties</h2><SlidersHorizontal className="h-4 w-4 text-white/40" /></div>
      <div className="space-y-3">
        {labels.map(label => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="mb-2 flex items-center justify-between text-sm"><span>{label}</span><ChevronDown className="h-4 w-4 text-white/35" /></div><div className="h-2 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" /></div></div>)}
        <button className="mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/15"><Wand2 className="mr-2 inline h-4 w-4" />Apply AI Assist</button>
      </div>
    </Panel>
  );
}
