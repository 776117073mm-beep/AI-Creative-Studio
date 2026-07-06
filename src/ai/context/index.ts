export interface IWorkspaceContext {
  activePage: string;
  focusedTrackId?: string;
  selectedAssetIds: string[];
  systemLoad: { cpu: number; gpu: number; ram: number };
}

export class AiContextManager {
  private static instance: AiContextManager;
  private currentContext: IWorkspaceContext = {
    activePage: "dashboard",
    selectedAssetIds: [],
    systemLoad: { cpu: 12, gpu: 28, ram: 14 }
  };

  private constructor() {}

  public static getInstance(): AiContextManager {
    if (!AiContextManager.instance) {
      AiContextManager.instance = new AiContextManager();
    }
    return AiContextManager.instance;
  }

  public getContext(): IWorkspaceContext {
    return this.currentContext;
  }

  public updateContext(delta: Partial<IWorkspaceContext>): void {
    this.currentContext = {
      ...this.currentContext,
      ...delta
    };
  }
}
