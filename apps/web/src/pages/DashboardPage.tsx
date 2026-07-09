import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Folder,
  FolderOpen,
  Headphones,
  Home,
  Image,
  Layers3,
  LifeBuoy,
  Menu,
  Mic2,
  Music,
  Palette,
  Play,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserCircle,
  Video,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: ProjectType;
  updatedAt: string;
  status: string;
}

type ProjectType = 'video' | 'design' | 'motion' | 'audio' | 'presentation' | 'image';
type ActiveSection = 'dashboard' | 'assets' | 'analytics' | 'billing' | 'settings';

interface ImportedAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'other';
  size: number;
  localUrl: string;
  importedAt: string;
}

const mockProjects: Project[] = [
  { id: '1', name: 'YouTube Intro', type: 'video', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'Rendering' },
  { id: '2', name: 'Instagram Post', type: 'design', updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'Draft' },
  { id: '3', name: 'Podcast Episode 12', type: 'audio', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Mixing' },
  { id: '4', name: 'Product Demo', type: 'motion', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Review' },
];

const typeConfig: Record<ProjectType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string; editorPath: string; image: string; description: string }> = {
  video: { icon: Video, color: 'from-orange-500 to-rose-500', label: 'فيديو', editorPath: '/editor/video', image: 'bg-[radial-gradient(circle_at_25%_20%,#fb7185_0,#7c3aed_35%,#111827_72%)]', description: 'Cut, grade, subtitle, and render video stories.' },
  design: { icon: Palette, color: 'from-cyan-400 to-blue-500', label: 'تصميم', editorPath: '/editor/design', image: 'bg-[radial-gradient(circle_at_70%_20%,#22d3ee_0,#2563eb_35%,#111827_72%)]', description: 'Canvas layouts, brand systems, and social posts.' },
  motion: { icon: Sparkles, color: 'from-purple-400 to-fuchsia-500', label: 'حركة', editorPath: '/editor/video', image: 'bg-[radial-gradient(circle_at_35%_25%,#e879f9_0,#7c3aed_38%,#111827_74%)]', description: 'Kinetic typography and animated explainers.' },
  audio: { icon: Music, color: 'from-emerald-400 to-teal-500', label: 'صوتي', editorPath: '/editor/audio', image: 'bg-[radial-gradient(circle_at_50%_25%,#2dd4bf_0,#047857_40%,#111827_76%)]', description: 'Podcast cleanup, voice generation, and mixing.' },
  presentation: { icon: Layers3, color: 'from-yellow-300 to-orange-500', label: 'عرض', editorPath: '/editor/design', image: 'bg-[radial-gradient(circle_at_50%_30%,#facc15_0,#f97316_35%,#111827_76%)]', description: 'Decks, infographics, and visual storytelling.' },
  image: { icon: Image, color: 'from-sky-400 to-indigo-500', label: 'صورة', editorPath: '/editor/design', image: 'bg-[radial-gradient(circle_at_55%_25%,#38bdf8_0,#4f46e5_38%,#111827_76%)]', description: 'AI image edits and prompt-driven compositions.' },
};

const toolCards: ProjectType[] = ['motion', 'design', 'video', 'audio', 'image'];

function getEditorRoute(type: ProjectType, projectId = 'new'): string {
  return `${typeConfig[type].editorPath}?type=${type}&projectId=${projectId}`;
}

function getAssetType(file: File): ImportedAsset['type'] {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return 'other';
}

function formatDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;
  if (hours < 24) return 'Today';
  if (days < 7) return `${Math.floor(days)} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DashboardPage() {
  const [projects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Sarah J.');
  const [importedAssets, setImportedAssets] = useState<ImportedAsset[]>([]);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProjectType>('video');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [aiModel, setAiModel] = useState('Apollo Creative v2');
  const [stylePrompt, setStylePrompt] = useState('cinematic neon product launch');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.name) setUserName(data.user.user_metadata.name);
    });
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const nextAssets = files.map(file => ({
      id: `local_${Date.now()}_${file.name}`,
      name: file.name,
      type: getAssetType(file),
      size: file.size,
      localUrl: URL.createObjectURL(file),
      importedAt: new Date().toISOString(),
    }));

    setImportedAssets(prev => {
      const updated = [...nextAssets, ...prev];
      localStorage.setItem('ai-creative-studio-assets', JSON.stringify(updated.map(({ localUrl, ...asset }) => asset)));
      window.dispatchEvent(new CustomEvent('ai-creative-studio:assets-imported', { detail: nextAssets }));
      return updated;
    });
    setActiveSection('assets');
    event.target.value = '';
  };

  const launchConfiguredProject = () => {
    setCreateModalOpen(false);
    navigate(`${getEditorRoute(selectedType)}&ratio=${encodeURIComponent(aspectRatio)}&model=${encodeURIComponent(aiModel)}&prompt=${encodeURIComponent(stylePrompt)}`);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(88,28,135,0.45),transparent_28%),radial-gradient(circle_at_88%_14%,rgba(8,145,178,0.22),transparent_26%),linear-gradient(180deg,#0a0a0c,#030305)] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] p-3 sm:p-5">
        <aside className={`${sidebarCollapsed ? 'w-[86px]' : 'w-[260px]'} hidden shrink-0 flex-col rounded-[28px] border border-white/10 bg-zinc-950/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all duration-300 lg:flex`}>
          <div className="mb-6 flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">CS</div>
              {!sidebarCollapsed && <span className="truncate text-lg font-bold">Creative Studio</span>}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {[
              ['dashboard', Home, 'Dashboard'],
              ['assets', FolderOpen, 'Assets Library'],
              ['analytics', BarChart3, 'Analytics'],
              ['billing', CreditCard, 'Billing'],
              ['settings', Settings, 'Settings'],
            ].map(([id, Icon, label]) => (
              <button
                key={id as string}
                onClick={() => setActiveSection(id as ActiveSection)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${activeSection === id ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-white/58 hover:bg-white/7 hover:text-white'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{label as string}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
            {[[LifeBuoy, 'Support'], [UserCircle, 'Account']].map(([Icon, label]) => (
              <button key={label as string} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-white/55 transition hover:bg-white/7 hover:text-white">
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{label as string}</span>}
              </button>
            ))}
          </div>
        </aside>

        <main className="ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:ml-4">
          <header className="border-b border-white/10">
            <div className="flex flex-col items-center gap-5 bg-black/35 px-4 py-8 text-center sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-purple-200/70">AI Creative Studio</p>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">All-in-one studio for all types of media designs.</h1>
              <p className="max-w-2xl text-sm text-white/55">استوديو إبداعي بالذكاء الاصطناعي ممول ذاتياً — polished workspaces for video, audio, image design, animation, and AI-assisted production.</p>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 bg-zinc-950/45 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button className="rounded-2xl border border-white/10 bg-white/5 p-3 lg:hidden" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xl font-bold">Creator Dashboard</p>
                  <p className="text-xs text-white/45">Welcome back, {userName} · Creative Director</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search" className="w-full rounded-2xl border border-white/10 bg-white/7 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-purple-400/70 sm:w-72" />
                </label>
                <button onClick={() => setExportModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm font-semibold transition hover:border-cyan-400/60 hover:bg-cyan-400/10">
                  <Activity className="h-4 w-4" /> Export/Render
                </button>
                <button className="relative rounded-2xl border border-white/10 bg-white/7 p-3 text-white/75 transition hover:text-white">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-3 border-b border-white/10 bg-black/20 p-4 sm:grid-cols-3 sm:p-6">
            {[['Recent Projects', Folder, '24 files'], ['Activity', Activity, '83% live'], ['AI Nodes', Zap, '12 online']].map(([label, Icon, meta], index) => (
              <button key={label as string} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:scale-[1.01] hover:border-purple-400/50 hover:bg-white/8">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-purple-500/10 p-2 text-purple-200"><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold">{label as string}</p>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                      <div className={`${index === 1 ? 'w-3/4 bg-blue-400' : 'w-1/2 bg-white/20'} h-full rounded-full`} />
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs text-white/40">{meta as string}<ChevronRight className="h-4 w-4" /></span>
              </button>
            ))}
          </section>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeSection === 'dashboard' && (
              <>
                <section className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 shadow-xl shadow-black/20 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-100"><Sparkles className="h-3.5 w-3.5" /> Production Control</p>
                    <h2 className="text-2xl font-black sm:text-3xl">Launch a professional AI media engine</h2>
                    <p className="mt-2 max-w-2xl text-sm text-white/55">Choose a tool, upload assets, or open an existing project. Every card routes to its purpose-built live preview workspace.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input ref={uploadInputRef} type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={handleUploadFiles} />
                    <button onClick={() => uploadInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 px-5 py-3 text-sm font-bold transition hover:scale-[1.02] hover:border-purple-400/60 hover:bg-purple-500/10">
                      <Upload className="h-4 w-4" /> Upload Assets
                    </button>
                    <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-3 text-sm font-bold shadow-lg shadow-purple-950/40 transition hover:scale-[1.02]">
                      <Plus className="h-4 w-4" /> Create New Project
                    </button>
                  </div>
                </section>

                <section className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Tools Overview</h2>
                    <button className="text-sm text-white/45 transition hover:text-white">View all</button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {toolCards.map(type => {
                      const config = typeConfig[type];
                      const Icon = config.icon;
                      return (
                        <button key={type} onClick={() => navigate(getEditorRoute(type))} className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 p-2 text-left shadow-lg shadow-black/25 transition-all hover:-translate-y-1 hover:scale-[1.01] hover:border-purple-400/60 hover:bg-white/8">
                          <div className={`${config.image} relative mb-4 flex aspect-square items-end overflow-hidden rounded-2xl p-4`}>
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-0 transition group-hover:opacity-100" />
                            <span className="rounded-2xl border border-white/15 bg-black/35 p-3 backdrop-blur-md"><Icon className="h-6 w-6" /></span>
                          </div>
                          <div className="px-2 pb-3">
                            <h3 className="text-lg font-bold">{config.label}</h3>
                            <p className="mt-2 min-h-12 text-xs leading-5 text-white/55">{config.description}</p>
                            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
                              <span>{type === 'audio' ? 'Launch Voice Lab' : type === 'design' || type === 'image' ? 'Open Canvas' : 'Launch Tool'}</span>
                              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/45 p-5 backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-bold">Recent Projects</h2>
                      <span className="text-xs text-white/40">{filteredProjects.length} active</span>
                    </div>
                    <div className="space-y-3">
                      {filteredProjects.map(project => {
                        const config = typeConfig[project.type];
                        const Icon = config.icon;
                        return (
                          <Link key={project.id} to={getEditorRoute(project.type, project.id)} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:scale-[1.01] hover:border-purple-400/50 hover:bg-white/7">
                            <span className={`rounded-2xl bg-gradient-to-br ${config.color} p-3 shadow-lg shadow-black/20`}><Icon className="h-5 w-5" /></span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{project.name}</p>
                              <p className="text-xs text-white/40">{config.label} · {formatDate(project.updatedAt)}</p>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{project.status}</span>
                            <ChevronRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-1" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <AssetImportPanel assets={importedAssets} onUpload={() => uploadInputRef.current?.click()} />
                </section>
              </>
            )}

            {activeSection === 'assets' && <AssetImportPanel assets={importedAssets} onUpload={() => uploadInputRef.current?.click()} expanded />}
            {activeSection === 'analytics' && <PlaceholderPanel icon={BarChart3} title="Analytics" description="Track render minutes, generated assets, storage usage, and team velocity." />}
            {activeSection === 'billing' && <PlaceholderPanel icon={CreditCard} title="Billing & Credits" description="Monitor subscription status, cloud render credits, and upcoming invoices." />}
            {activeSection === 'settings' && <PlaceholderPanel icon={Settings} title="Studio Settings" description="Manage workspace preferences, AI model defaults, brand profiles, and exports." />}
          </div>
        </main>
      </div>

      <CreateProjectModal open={createModalOpen} selectedType={selectedType} setSelectedType={setSelectedType} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} aiModel={aiModel} setAiModel={setAiModel} stylePrompt={stylePrompt} setStylePrompt={setStylePrompt} onClose={() => setCreateModalOpen(false)} onCreate={launchConfiguredProject} />
      <ExportRenderModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  );
}

function AssetImportPanel({ assets, onUpload, expanded = false }: { assets: ImportedAsset[]; onUpload: () => void; expanded?: boolean }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-zinc-950/45 p-5 backdrop-blur-xl ${expanded ? 'min-h-[520px]' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Creative Assets</h2>
          <p className="text-xs text-white/40">Prepared for signed upload handoff</p>
        </div>
        <button onClick={onUpload} className="rounded-2xl border border-white/10 bg-white/7 px-4 py-2 text-sm font-semibold transition hover:border-cyan-400/60 hover:bg-cyan-400/10"><Upload className="mr-2 inline h-4 w-4" />Import</button>
      </div>
      {assets.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
          <Upload className="mb-3 h-8 w-8 text-white/35" />
          <p className="font-semibold">Drop in video, audio, or image files</p>
          <p className="mt-2 text-sm text-white/45">Imported metadata is stored locally and broadcast to the app asset pipeline.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {assets.map(asset => (
            <div key={asset.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="truncate font-semibold">{asset.name}</p>
              <p className="mt-1 text-xs text-white/40">{asset.type.toUpperCase()} · {(asset.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderPanel({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex min-h-[520px] flex-col justify-between rounded-3xl border border-white/10 bg-zinc-950/45 p-8 backdrop-blur-xl">
      <div>
        <span className="mb-5 inline-flex rounded-3xl bg-purple-500/10 p-4 text-purple-200"><Icon className="h-8 w-8" /></span>
        <h2 className="text-3xl font-black">{title}</h2>
        <p className="mt-3 max-w-2xl text-white/55">{description}</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {['Realtime', 'Automated', 'Secure'].map(label => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">{label}</div>)}
      </div>
    </div>
  );
}

function CreateProjectModal(props: {
  open: boolean;
  selectedType: ProjectType;
  setSelectedType: (type: ProjectType) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  stylePrompt: string;
  setStylePrompt: (prompt: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl">
      <div className="w-full max-w-3xl scale-100 rounded-[32px] border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/70 transition-all">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-200/70">New Project</p>
            <h2 className="mt-1 text-2xl font-black">Create with AI settings</h2>
          </div>
          <button onClick={props.onClose} className="rounded-2xl p-2 text-white/45 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">Creative engine</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(typeConfig) as ProjectType[]).map(type => {
                const config = typeConfig[type];
                const Icon = config.icon;
                return <button key={type} onClick={() => props.setSelectedType(type)} className={`rounded-2xl border p-3 text-left transition ${props.selectedType === type ? 'border-purple-400 bg-purple-500/15' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}><Icon className="mb-2 h-5 w-5" /><span className="text-sm font-semibold">{config.label}</span></button>;
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-white/70">Aspect ratio</label>
            <div className="flex flex-wrap gap-2">{['16:9', '9:16', '1:1', '4:5'].map(ratio => <button key={ratio} onClick={() => props.setAspectRatio(ratio)} className={`rounded-xl border px-4 py-2 text-sm ${props.aspectRatio === ratio ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03]'}`}>{ratio}</button>)}</div>
            <label className="block text-sm font-semibold text-white/70">AI model version</label>
            <select value={props.aiModel} onChange={event => props.setAiModel(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-400">
              <option>Apollo Creative v2</option>
              <option>Runway-style Motion v1</option>
              <option>Eleven Voice Mix v3</option>
            </select>
            <label className="block text-sm font-semibold text-white/70">Style prompt</label>
            <textarea value={props.stylePrompt} onChange={event => props.setStylePrompt(event.target.value)} className="h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-purple-400" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={props.onClose} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/65 transition hover:text-white">Cancel</button>
          <button onClick={props.onCreate} className="rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-3 text-sm font-bold shadow-lg shadow-purple-950/40 transition hover:scale-[1.02]">Launch Workspace</button>
        </div>
      </div>
    </div>
  );
}

function ExportRenderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/70">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/70">Render Queue</p>
            <h2 className="mt-1 text-2xl font-black">Export status</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-white/45 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {[['Timeline Conform', 100], ['AI Upscale Pass', 72], ['H.264 Encode', 38]].map(([label, progress]) => (
          <div key={label as string} className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex justify-between text-sm"><span>{label as string}</span><span className="text-white/45">{progress as number}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${progress}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
