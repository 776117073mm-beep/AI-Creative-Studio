import { Project } from "../types";

export interface SessionData {
  sessionId: string;
  projectId: string;
  projectName: string;
  activePage: string;
  viewportZoom: number;
  lastCheckpointTime: number;
  isPinned: boolean;
  isAutosaved: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private openSessions: Map<string, SessionData> = new Map();
  private activeSessionId: string | null = null;
  private recentSessions: SessionData[] = [];

  private constructor() {
    this.initializeDefaultSessions();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public getActiveSession(): SessionData | undefined {
    return this.activeSessionId ? this.openSessions.get(this.activeSessionId) : undefined;
  }

  public listOpenSessions(): SessionData[] {
    return Array.from(this.openSessions.values());
  }

  public listRecentSessions(): SessionData[] {
    return [...this.recentSessions];
  }

  public openProjectSession(project: Project, activePage = "workspace"): void {
    const sessId = `session_${project.id}`;
    if (!this.openSessions.has(sessId)) {
      const newSess: SessionData = {
        sessionId: sessId,
        projectId: project.id,
        projectName: project.name,
        activePage,
        viewportZoom: 100,
        lastCheckpointTime: Date.now(),
        isPinned: !!project.pinned,
        isAutosaved: true
      };
      this.openSessions.set(sessId, newSess);
      this.addToRecent(newSess);
    }
    this.activeSessionId = sessId;
    console.log(`[SessionManager] Opened session for project [${project.name}]. Active: ${sessId}`);
  }

  public closeProjectSession(projectId: string): void {
    const sessId = `session_${projectId}`;
    this.openSessions.delete(sessId);
    if (this.activeSessionId === sessId) {
      const remaining = this.listOpenSessions();
      this.activeSessionId = remaining.length > 0 ? remaining[0].sessionId : null;
    }
    console.log(`[SessionManager] Closed project session: ${sessId}`);
  }

  public pinSession(projectId: string, pin: boolean): void {
    const sessId = `session_${projectId}`;
    const sess = this.openSessions.get(sessId);
    if (sess) {
      sess.isPinned = pin;
    }
    const recent = this.recentSessions.find(s => s.projectId === projectId);
    if (recent) {
      recent.isPinned = pin;
    }
    console.log(`[SessionManager] Project session pinning state updated to: ${pin}`);
  }

  public createCrashCheckpoint(): string {
    const active = this.getActiveSession();
    if (!active) return "No active project session to back up.";

    active.lastCheckpointTime = Date.now();
    active.isAutosaved = true;
    
    // Save state string to simulate localStorage write
    const checkpointData = JSON.stringify(active);
    localStorage.setItem("studio_crash_checkpoint", checkpointData);
    
    console.log(`[SessionManager] Saved persistent crash-recovery state checkpoint for: ${active.projectName}`);
    return checkpointData;
  }

  public restoreSessionFromCrash(): SessionData | null {
    const raw = localStorage.getItem("studio_crash_checkpoint");
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as SessionData;
      data.projectName = `[RECOVERED] ${data.projectName}`;
      data.lastCheckpointTime = Date.now();
      
      this.openSessions.set(data.sessionId, data);
      this.activeSessionId = data.sessionId;
      
      console.log(`[SessionManager] Recovered lost system session after virtual crash: ${data.projectName}`);
      return data;
    } catch {
      return null;
    }
  }

  private addToRecent(sess: SessionData): void {
    this.recentSessions = this.recentSessions.filter(s => s.projectId !== sess.projectId);
    this.recentSessions.unshift(JSON.parse(JSON.stringify(sess)));
    if (this.recentSessions.length > 10) {
      this.recentSessions.pop();
    }
  }

  private initializeDefaultSessions(): void {
    const dummyRecent: SessionData[] = [
      {
        sessionId: "session_proj_1",
        projectId: "proj_1",
        projectName: "Cinematic Promo Video",
        activePage: "workspace",
        viewportZoom: 100,
        lastCheckpointTime: Date.now() - 3600000,
        isPinned: true,
        isAutosaved: true
      },
      {
        sessionId: "session_proj_2",
        projectId: "proj_2",
        projectName: "Spotify Podcast Mastering",
        activePage: "audio-editing",
        viewportZoom: 90,
        lastCheckpointTime: Date.now() - 86400000,
        isPinned: false,
        isAutosaved: true
      },
      {
        sessionId: "session_proj_3",
        projectId: "proj_3",
        projectName: "3D Nike Shoe Commercial",
        activePage: "3d-studio",
        viewportZoom: 120,
        lastCheckpointTime: Date.now() - 172800000,
        isPinned: false,
        isAutosaved: true
      }
    ];
    dummyRecent.forEach(s => this.addToRecent(s));
  }
}
