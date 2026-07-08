import {
  BaseEngine,
  EngineConfigSchema,
  ProjectGraph,
  ProjectId,
  NodeId,
  EventBus,
  globalEventBus,
} from '@ai-creative-studio/core';
import { z } from 'zod';

const CreativeEngineConfigSchema = EngineConfigSchema.extend({
  maxProjects: z.number().optional().default(10),
  autoSaveInterval: z.number().optional().default(30000),
});

type CreativeEngineConfig = z.infer<typeof CreativeEngineConfigSchema>;

export interface IProjectInfo {
  id: ProjectId;
  name: string;
  createdAt: number;
  updatedAt: number;
  type: 'video' | 'design' | 'audio' | 'presentation' | 'image' | '3d' | 'animation';
  resolution: { width: number; height: number };
  frameRate: number;
  duration: number;
}

export class CreativeEngine extends BaseEngine {
  private projects: Map<ProjectId, ProjectGraph> = new Map();
  private projectInfo: Map<ProjectId, IProjectInfo> = new Map();
  private activeProjectId: ProjectId | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: CreativeEngineConfig) {
    super(CreativeEngineConfigSchema.parse(config));
  }

  protected async onInitialize(): Promise<void> {
    this.eventBus.on('project:load' as any, (event) => this.handleProjectLoad(event));
    this.eventBus.on('project:save' as any, (event) => this.handleProjectSave(event));
    this.eventBus.on('project:close' as any, (event) => this.handleProjectClose(event));
  }

  protected override async onDestroy(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    for (const projectId of this.projects.keys()) {
      await this.closeProject(projectId);
    }
    this.projects.clear();
    this.projectInfo.clear();
  }

  createProject(
    name: string,
    type: IProjectInfo['type'],
    options: {
      resolution?: { width: number; height: number };
      frameRate?: number;
      duration?: number;
    } = {}
  ): ProjectId {
    const projectId = crypto.randomUUID() as ProjectId;

    const graph = new ProjectGraph(projectId);
    graph.addNode('project', {
      name,
      inputs: { type, ...options },
    });

    const info: IProjectInfo = {
      id: projectId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type,
      resolution: options.resolution ?? { width: 1920, height: 1080 },
      frameRate: options.frameRate ?? 30,
      duration: options.duration ?? 0,
    };

    this.projects.set(projectId, graph);
    this.projectInfo.set(projectId, info);

    if (!this.activeProjectId) {
      this.activeProjectId = projectId;
    }

    this.emitEvent({
      type: 'project:load',
      timestamp: Date.now(),
      source: this.id,
    });

    return projectId;
  }

  loadProject(projectId: ProjectId, data: unknown): void {
    if (this.projects.has(projectId)) {
      throw new Error(`Project ${projectId} already loaded`);
    }

    const graph = ProjectGraph.deserialize(data as any);
    this.projects.set(projectId, graph);
    this.activeProjectId = projectId;
  }

  closeProject(projectId: ProjectId): void {
    const graph = this.projects.get(projectId);
    if (!graph) return;

    graph.clear();
    this.projects.delete(projectId);
    this.projectInfo.delete(projectId);

    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects.keys().next().value || null;
    }
  }

  getProject(projectId: ProjectId): ProjectGraph | undefined {
    return this.projects.get(projectId);
  }

  getActiveProject(): ProjectGraph | undefined {
    return this.activeProjectId ? this.projects.get(this.activeProjectId) : undefined;
  }

  getActiveProjectId(): ProjectId | undefined {
    return this.activeProjectId;
  }

  getAllProjects(): IProjectInfo[] {
    return Array.from(this.projectInfo.values());
  }

  getProjectInfo(projectId: ProjectId): IProjectInfo | undefined {
    return this.projectInfo.get(projectId);
  }

  updateProjectInfo(projectId: ProjectId, updates: Partial<IProjectInfo>): void {
    const info = this.projectInfo.get(projectId);
    if (!info) return;

    Object.assign(info, updates, { updatedAt: Date.now() });
  }

  switchProject(projectId: ProjectId): void {
    if (!this.projects.has(projectId)) {
      throw new Error(`Project ${projectId} not found`);
    }
    this.activeProjectId = projectId;
  }

  private handleProjectLoad(event: { payload?: { projectId?: ProjectId; data?: unknown } }): void {
    const { projectId, data } = event.payload || {};
    if (projectId && data) {
      this.loadProject(projectId, data);
    }
  }

  private handleProjectSave(event: { payload?: { projectId?: ProjectId; data?: unknown; path?: string } }): void {
    const { projectId } = event.payload || {};
    if (projectId) {
      const graph = this.projects.get(projectId);
      if (graph) {
        graph.serialize();
      }
    }
  }

  private handleProjectClose(event: { payload?: { projectId?: ProjectId } }): void {
    const { projectId } = event.payload || {};
    if (projectId) {
      this.closeProject(projectId);
    }
  }

  getCapabilities(): string[] {
    return [
      'project:create',
      'project:load',
      'project:save',
      'project:close',
      'project:switch',
      'scene:create',
      'scene:delete',
      'layer:add',
      'layer:delete',
      'layer:reorder',
      'effect:apply',
      'effect:chain',
      'filter:apply',
      'mask:create',
    ];
  }
}
