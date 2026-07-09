import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Video,
  Image,
  Music,
  Presentation,
  FileText,
  Trash2,
  MoreHorizontal,
  Search,
  Grid3X3,
  List,
  Clock,
  Users,
  Upload,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: 'video' | 'design' | 'motion' | 'audio' | 'presentation' | 'image';
  updatedAt: string;
  thumbnail?: string;
}

const mockProjects: Project[] = [
  { id: '1', name: 'YouTube Intro', type: 'video', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', name: 'Instagram Post', type: 'design', updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', name: 'Podcast Episode 12', type: 'audio', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '4', name: 'Product Demo', type: 'video', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '5', name: 'Brand Assets', type: 'design', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '6', name: 'Q4 Presentation', type: 'presentation', updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const typeConfig = {
  video: { icon: Video, color: 'text-accent-orange', label: 'فيديو', editorPath: '/editor/video' },
  design: { icon: Image, color: 'text-accent-cyan', label: 'تصميم', editorPath: '/editor/design' },
  motion: { icon: Presentation, color: 'text-primary-400', label: 'حركة', editorPath: '/editor/video' },
  audio: { icon: Music, color: 'text-accent-green', label: 'صوتي', editorPath: '/editor/audio' },
  presentation: { icon: FileText, color: 'text-accent-yellow', label: 'عرض', editorPath: '/editor/design' },
  image: { icon: Image, color: 'text-accent-cyan', label: 'صورة', editorPath: '/editor/design' },
};

type ProjectType = keyof typeof typeConfig;

interface ImportedAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'other';
  size: number;
  localUrl: string;
  importedAt: string;
}

function getEditorRoute(type: ProjectType, projectId = 'new'): string {
  return `${typeConfig[type].editorPath}?type=${type}&projectId=${projectId}`;
}

function getAssetType(file: File): ImportedAsset['type'] {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return 'other';
}

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [userName, setUserName] = useState('Creator');
  const [importedAssets, setImportedAssets] = useState<ImportedAsset[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.name) {
        setUserName(data.user.user_metadata.name);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

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

    event.target.value = '';
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    const days = hours / 24;

    if (hours < 24) {
      return 'Today';
    } else if (days < 7) {
      return `${Math.floor(days)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-gradient-to-b from-zinc-900 via-[#0a0a0f] to-black text-white">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-semibold text-white">Creative Studio</span>
              <p className="max-w-[72vw] truncate text-xs text-white/50 sm:max-w-none">استوديو إبداعي بالذكاء الاصطناعي ممول ذاتياً</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-md transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 sm:w-64"
              />
            </div>

            <button
              onClick={handleSignOut}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-purple-300">استوديو إبداعي بالذكاء الاصطناعي ممول ذاتياً</p>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Welcome back, {userName}</h1>
            <p className="max-w-2xl text-white/60">Launch the right specialized editor, import assets, and keep every creative workflow organized from one polished command center.</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <input
              ref={uploadInputRef}
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              className="hidden"
              onChange={handleUploadFiles}
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-purple-500 hover:bg-purple-500/10"
            >
              <Upload className="h-5 w-5" />
              <span>Upload assets</span>
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 transition-all hover:scale-[1.02] hover:from-purple-500 hover:to-cyan-400"
            >
              <Plus className="h-5 w-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">Create New</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => {
                    navigate(getEditorRoute(type as ProjectType));
                  }}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-purple-500 hover:bg-purple-500/10 hover:shadow-xl hover:shadow-purple-950/20"
                >
                  <div className={`w-12 h-12 rounded-xl ${config.color.replace('text-', 'bg-')}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-white/80">{config.label}</span>
                </button>
              );
            })}
          </div>
        </section>


        {importedAssets.length > 0 && (
          <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Imported assets</h2>
              <span className="text-xs text-white/40">Prepared for signed upload handoff</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {importedAssets.slice(0, 6).map(asset => (
                <div key={asset.id} className="rounded-xl border border-zinc-800 bg-black/20 p-3">
                  <p className="truncate text-sm font-medium text-white">{asset.name}</p>
                  <p className="mt-1 text-xs text-white/40">{asset.type.toUpperCase()} · {(asset.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => {
                const config = typeConfig[project.type];
                const Icon = config.icon;

                return (
                  <Link
                    key={project.id}
                    to={getEditorRoute(project.type, project.id)}
                    className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-purple-500 hover:shadow-xl hover:shadow-purple-950/20"
                  >
                    <div className="aspect-video bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                      <Icon className={`w-12 h-12 ${config.color}`} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white group-hover:text-primary-400 transition-colors">
                          {project.name}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
              {filteredProjects.map((project, index) => {
                const config = typeConfig[project.type];
                const Icon = config.icon;

                return (
                  <Link
                    key={project.id}
                    to={getEditorRoute(project.type, project.id)}
                    className={`flex items-center gap-4 px-4 py-3 transition-all hover:bg-purple-500/10 hover:text-purple-100 ${
                      index > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{project.name}</p>
                    </div>
                    <span className="text-sm text-white/40">
                      {formatDate(project.updatedAt)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSelect={(type) => {
            setShowNewProjectModal(false);
            navigate(getEditorRoute(type as ProjectType));
          }}
        />
      )}
    </div>
  );
}

function NewProjectModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-white">New Project</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 transition-all hover:scale-[1.02] hover:border-purple-500 hover:bg-purple-500/10"
                >
                  <Icon className={`w-8 h-8 ${config.color}`} />
                  <span className="text-sm font-medium text-white/80">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
