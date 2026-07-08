import React, { useEffect, useState } from 'react';
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
  video: { icon: Video, color: 'text-accent-orange', label: 'Video' },
  design: { icon: Image, color: 'text-accent-cyan', label: 'Design' },
  motion: { icon: Presentation, color: 'text-primary-400', label: 'Motion' },
  audio: { icon: Music, color: 'text-accent-green', label: 'Audio' },
  presentation: { icon: FileText, color: 'text-accent-yellow', label: 'Presentation' },
  image: { icon: Image, color: 'text-accent-cyan', label: 'Image' },
};

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [userName, setUserName] = useState('Creator');
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
    <div className="h-screen w-screen bg-[#0a0a0f] overflow-y-auto">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="text-lg font-semibold text-white">Creative Studio</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-64 bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {userName}</h1>
            <p className="text-white/60">What would you like to create today?</p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn btn-primary btn-lg"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
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
                    navigate(`/project/new?type=${type}`);
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-surface-elevated border border-border rounded-xl hover:border-primary-500 hover:bg-primary-600/10 transition-all group"
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
                    to={`/project/${project.id}`}
                    className="group bg-surface-elevated border border-border rounded-xl overflow-hidden hover:border-primary-500 transition-colors"
                  >
                    <div className="aspect-video bg-surface flex items-center justify-center">
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
            <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
              {filteredProjects.map((project, index) => {
                const config = typeConfig[project.type];
                const Icon = config.icon;

                return (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${
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
            navigate(`/project/new?type=${type}`);
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
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
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
                  className="flex flex-col items-center gap-3 p-4 bg-surface-elevated border border-border rounded-lg hover:border-primary-500 hover:bg-primary-600/10 transition-all"
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
