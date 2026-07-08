import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'success', message: 'Project saved successfully', timestamp: Date.now() - 5000 },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'text-accent-green',
    error: 'text-accent-red',
    info: 'text-primary-400',
    warning: 'text-accent-orange',
  };

  return (
    <div className="fixed top-20 right-4 z-floating flex flex-col gap-2 min-w-[280px] max-w-[400px]">
      {notifications && notifications.length > 0 && (
        <>
          {notifications.map((notification) => {
            const Icon = icons[notification.type];
            return (
              <div
                key={notification.id}
                className="bg-surface border border-border rounded-lg shadow-xl px-4 py-3 flex items-start gap-3 animate-in slide-in-from-right duration-200"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${colors[notification.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{notification.message}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function useState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  return React.useState(initial);
}
