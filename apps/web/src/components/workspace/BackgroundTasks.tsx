import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface BackgroundTask {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'completed' | 'error';
  message?: string;
}

const mockTasks: BackgroundTask[] = [
  { id: '1', name: 'Rendering video...', progress: 67, status: 'running' },
  { id: '2', name: 'Generating subtitles...', progress: 45, status: 'running' },
];

export function BackgroundTasks() {
  const [tasks, setTasks] = useState<BackgroundTask[] | null>(null);

  return (
    <div className="fixed bottom-4 right-4 z-floating flex flex-col gap-2 min-w-[280px] max-w-[320px]">
      {tasks && tasks.length > 0 && (
        <div className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
          {tasks.map((task) => (
            <div key={task.id} className="px-4 py-3 border-b border-border last:border-b-0">
              <div className="flex items-start gap-3">
                {task.status === 'running' && (
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0 mt-0.5" />
                )}
                {task.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                )}
                {task.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{task.name}</div>
                  {task.status === 'running' && (
                    <>
                      <div className="mt-2 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-white/40">{task.progress}%</div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  return React.useState(initial);
}
