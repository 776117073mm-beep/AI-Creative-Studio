import { useState } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Zap, 
  Cpu, 
  Sparkles,
  Info
} from "lucide-react";
import { AppNotification } from "../types";

interface NotificationsPageProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsPage({
  notifications,
  onMarkRead,
  onClearAll
}: NotificationsPageProps) {
  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE EVENTS</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Studio Alerts & Notifications</h1>
        </div>

        <button
          onClick={onClearAll}
          className="px-3 py-1.5 border border-border-light text-xs font-semibold rounded-xl text-gray-600 hover:text-text-dark hover:border-gray-400 cursor-pointer"
        >
          Clear Notifications
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
        <div className="border-b border-border-light pb-2 shrink-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Alerts Stream</span>
          <h3 className="text-xs font-bold text-text-dark mt-0.5">Active Studio Events</h3>
        </div>

        {/* Alerts scroll list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Bell className="w-8 h-8 text-gray-300 stroke-1 animate-bounce" />
              <span className="text-xs font-semibold block mt-3">All caught up! No active studio notifications.</span>
            </div>
          ) : (
            notifications.map((notif) => {
              const isRender = notif.type === "rendering";
              const isAI = notif.type === "system";
              
              return (
                <div 
                  key={notif.id}
                  className={`p-3.5 border rounded-xl flex items-center justify-between text-left transition-all ${
                    notif.read 
                      ? "bg-panel/10 border-border-light/40 opacity-60" 
                      : "bg-panel border-purple-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                      {isRender ? <Cpu className="w-4 h-4 text-purple-600" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-dark block">{notif.title}</span>
                      <span className="text-[10px] text-gray-500 block mt-1">{notif.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono text-gray-400">{notif.timestamp}</span>
                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        className="p-1 hover:bg-gray-200 rounded-lg text-purple-600 cursor-pointer"
                        title="Mark read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
