import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Send, 
  Check, 
  ShieldAlert, 
  History 
} from "lucide-react";

interface CommentItem {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
}

export default function TeamWorkspace() {
  const [emailInput, setEmailInput] = useState("");
  const [isInvited, setIsInvited] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([
    { id: "c1", author: "Sarah Jenkins", role: "Colorist Lead", text: "The low midtones look slightly desaturated on the second track. Shall we boost lift saturation by 5%?", time: "20m ago" },
    { id: "c2", author: "Marc Antoine", role: "VFX Supervisor", text: "Rotoscoping mask coordinates look tightly locked. Ready for particle flame keying compile.", time: "1h ago" }
  ]);

  const teamMembers = [
    { name: "Siddharth Roy", role: "Project Producer", status: "online", activeNode: "Workspace Studio" },
    { name: "Sarah Jenkins", role: "Colorist Lead", status: "idle", activeNode: "Color Grading Wheels" },
    { name: "Marc Antoine", role: "VFX Supervisor", status: "offline", activeNode: "VFX Particle Studio" }
  ];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments(prev => [
      {
        id: "c_" + Date.now(),
        author: "You (Editor Owner)",
        role: "Lead Editor",
        text: commentText,
        time: "Just now"
      },
      ...prev
    ]);
    setCommentText("");
  };

  const handleInviteSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsInvited(true);
    setTimeout(() => {
      setIsInvited(false);
      setEmailInput("");
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">MULTIPLAYER COLLABORATION</span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Team Collaboration Spaces</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Active Members & Invitations */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Members list */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Active Team Collaborators</span>
            </span>

            <div className="space-y-2">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="p-3 bg-panel/50 border border-border-light rounded-xl flex items-center justify-between text-left">
                  <div className="flex items-center space-x-2.5">
                    {/* Circle status color */}
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      member.status === "online" ? "bg-green-500 animate-pulse" :
                      member.status === "idle" ? "bg-orange-500" : "bg-gray-400"
                    }`}></span>
                    <div>
                      <span className="text-xs font-bold text-text-dark block leading-none">{member.name}</span>
                      <span className="text-[9px] text-gray-400 block mt-1">{member.role}</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono text-gray-500 bg-btn-bg px-1.5 py-0.5 rounded border border-border-light">
                    {member.activeNode}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invitation form */}
          <form onSubmit={handleInviteSim} className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite New Collaborators</span>
            </span>

            <div className="flex space-x-2">
              <input 
                type="email" 
                placeholder="colleague@agency.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 h-8 px-2.5 bg-panel border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={isInvited}
                className="px-3 bg-text-dark hover:bg-opacity-90 disabled:bg-green-600 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center shrink-0"
              >
                {isInvited ? <Check className="w-3.5 h-3.5" /> : <span>Invite</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Timeline comments revision checklist feedback */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Revision Dialogue Comments</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Timeline Notes & Thread</h3>
          </div>

          {/* Scrollable comments */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
            {comments.map((comm) => (
              <div key={comm.id} className="p-3 bg-panel/30 border border-border-light rounded-xl text-left">
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 border-b border-border-light/40 pb-1.5 mb-2">
                  <span>{comm.author} • {comm.role}</span>
                  <span>{comm.time}</span>
                </div>
                <span className="text-xs font-semibold text-text-dark leading-relaxed">
                  {comm.text}
                </span>
              </div>
            ))}
          </div>

          {/* Write comment */}
          <form onSubmit={handleSendComment} className="border-t border-border-light/60 pt-3 flex space-x-2 shrink-0">
            <input 
              type="text" 
              placeholder="e.g., 'Trimmed audio voice track 2. Ready for review'..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-9 px-3 bg-panel border border-border-light rounded-xl text-xs text-text-dark focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 bg-text-dark text-white rounded-xl text-xs font-semibold hover:bg-opacity-90 flex items-center justify-center cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Post Note</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
