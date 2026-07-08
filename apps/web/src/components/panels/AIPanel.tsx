import React, { useState, useRef, useEffect } from 'react';
import {
  Wand2,
  Send,
  Sparkles,
  Video,
  Music,
  Image,
  Type,
  Palette,
  Mic,
  Settings,
  User,
  Bot,
  Copy,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'thinking' | 'complete' | 'error';
}

const quickActions = [
  { id: 'subtitles', label: 'Generate Subtitles', icon: Type },
  { id: 'remove-bg', label: 'Remove Background', icon: Image },
  { id: 'enhance', label: 'Enhance Colors', icon: Palette },
  { id: 'audio-denoise', label: 'Denoise Audio', icon: Mic },
  { id: 'color-grade', label: 'Color Grade', icon: Palette },
  { id: 'transcribe', label: 'Transcribe Audio', icon: Music },
];

interface AIPanelProps {
  onClose: () => void;
}

export function AIPanel({ onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Creative Assistant. I can help you with video editing, animations, effects, color grading, and much more. What would you like to create today?",
      timestamp: new Date(),
      status: 'complete',
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    setMessages(prev => [...prev, {
      id: 'thinking',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'thinking',
    }]);

    setTimeout(() => {
      const assistantMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
        status: 'complete',
      };

      setMessages(prev => [...prev.filter(m => m.id !== 'thinking'), assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('subtitle') || lowerQuery.includes('caption')) {
      return "I'll generate subtitles for your video. I've analyzed the audio and created timestamps for the dialogue. The subtitles will appear as a new text track on your timeline. You can edit them in the properties panel.";
    }
    if (lowerQuery.includes('background') || lowerQuery.includes('remove')) {
      return "I'll remove the background from the selected clip. This will create a transparent background effect. Processing may take a few moments depending on the video length.";
    }
    if (lowerQuery.includes('color') || lowerQuery.includes('enhance') || lowerQuery.includes('grade')) {
      return "I've applied a cinematic color grade to your footage. The highlights have been softened, shadows lifted, and I've added a subtle teal-orange color contrast. You can adjust the intensity in the effects panel.";
    }
    if (lowerQuery.includes('cut') || lowerQuery.includes('trim')) {
      return "I'll help you cut or trim the video. Select the clip on the timeline, and I can automatically detect scene transitions or you can specify the exact timestamps.";
    }

    return `I understand you want to "${query}". I'm analyzing your project and preparing the necessary operations. This may involve multiple steps which I'll guide you through. Feel free to ask for clarification or make additional adjustments.`;
  };

  const handleQuickAction = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      setInput(action.label);
    }
  };

  return (
    <div className="fixed right-0 top-toolbar bottom-0 w-80 bg-surface border-l border-border z-floating flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-cyan" />
          <span className="font-semibold text-white">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-primary-600'
                  : 'bg-gradient-to-br from-accent-cyan to-primary-600'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            <div
              className={`flex-1 rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-primary-600/20 text-white'
                  : 'bg-surface-elevated text-white/90'
              }`}
            >
              {message.status === 'thinking' ? (
                <div className="flex items-center gap-2 text-white/60">
                  <Wand2 className="w-4 h-4 animate-pulse" />
                  <span>Processing...</span>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-surface-elevated hover:bg-white/5 text-xs text-white/70 hover:text-white transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to help..."
            rows={2}
            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
