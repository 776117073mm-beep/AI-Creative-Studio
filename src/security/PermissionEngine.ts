export type PermissionDomain = 
  | "modules" 
  | "plugins" 
  | "ai" 
  | "files" 
  | "cloud" 
  | "projects" 
  | "user_actions" 
  | "developer_tools" 
  | "background_services";

export interface PermissionDefinition {
  name: string;
  domain: PermissionDomain;
  description: string;
  defaultGranted: boolean;
}

export class PermissionEngine {
  private static instance: PermissionEngine;
  private permissionDefinitions: Map<string, PermissionDefinition> = new Map();
  private entityPermissions: Map<string, Set<string>> = new Map(); // key is entity ID (module ID, plugin ID, or "user")

  private constructor() {
    this.registerDefaultPermissions();
    this.grantDefaultPermissionsToEntity("user", true);
    this.grantDefaultPermissionsToEntity("system", true);
  }

  public static getInstance(): PermissionEngine {
    if (!PermissionEngine.instance) {
      PermissionEngine.instance = new PermissionEngine();
    }
    return PermissionEngine.instance;
  }

  public registerPermission(definition: PermissionDefinition): void {
    this.permissionDefinitions.set(definition.name, definition);
    console.log(`[PermissionEngine] Registered Permission Def: ${definition.name} in domain ${definition.domain}`);
  }

  public grantPermission(entityId: string, permissionName: string): void {
    if (!this.permissionDefinitions.has(permissionName)) {
      throw new Error(`[PermissionEngine] Cannot grant unregistered permission: ${permissionName}`);
    }

    let perms = this.entityPermissions.get(entityId);
    if (!perms) {
      perms = new Set();
      this.entityPermissions.set(entityId, perms);
    }
    perms.add(permissionName);
    console.log(`[PermissionEngine] Granted [${permissionName}] to Entity [${entityId}]`);
  }

  public revokePermission(entityId: string, permissionName: string): void {
    const perms = this.entityPermissions.get(entityId);
    if (perms) {
      perms.delete(permissionName);
      console.log(`[PermissionEngine] Revoked [${permissionName}] from Entity [${entityId}]`);
    }
  }

  public checkPermission(entityId: string, permissionName: string): boolean {
    // System always bypasses all checks
    if (entityId === "system" || entityId === "root") return true;

    const definitions = this.permissionDefinitions.get(permissionName);
    if (!definitions) return false;

    const entityPerms = this.entityPermissions.get(entityId);
    if (entityPerms && entityPerms.has(permissionName)) {
      return true;
    }

    // Fall back to default
    return definitions.defaultGranted;
  }

  public getEntityPermissions(entityId: string): string[] {
    const perms = this.entityPermissions.get(entityId);
    return perms ? Array.from(perms) : [];
  }

  public listAllPermissions(): PermissionDefinition[] {
    return Array.from(this.permissionDefinitions.values());
  }

  public grantDefaultPermissionsToEntity(entityId: string, isSuperUser = false): void {
    const all = this.listAllPermissions();
    for (const def of all) {
      if (isSuperUser || def.defaultGranted) {
        this.grantPermission(entityId, def.name);
      }
    }
  }

  private registerDefaultPermissions(): void {
    // Files
    this.registerPermission({ name: "storage_read", domain: "files", description: "Allows reading footage assets, caches, and XML indexes.", defaultGranted: true });
    this.registerPermission({ name: "storage_write", domain: "files", description: "Allows compiling frames, baking LUTs, and exporting WAV clips.", defaultGranted: true });

    // Modules
    this.registerPermission({ name: "gpu_access", domain: "modules", description: "Allows dispatching shader kernels, WebGL computations, and particle coordinates.", defaultGranted: true });
    this.registerPermission({ name: "audio_io", domain: "modules", description: "Allows accessing micro-buffer streams and sound tracks.", defaultGranted: true });

    // Plugins
    this.registerPermission({ name: "plugin_install", domain: "plugins", description: "Allows pulling plugin bundles from online portals.", defaultGranted: false });
    this.registerPermission({ name: "network_access", domain: "plugins", description: "Allows requesting third-party endpoints inside sandbox code.", defaultGranted: false });

    // AI
    this.registerPermission({ name: "ai_generation", domain: "ai", description: "Allows feeding prompt payloads into generative LLM nodes.", defaultGranted: true });
    this.registerPermission({ name: "ai_deep_research", domain: "ai", description: "Allows spinning up multi-layered web research subagents.", defaultGranted: false });

    // Cloud
    this.registerPermission({ name: "cloud_sync", domain: "cloud", description: "Allows syncing project workspaces to GCP bucket repositories.", defaultGranted: true });

    // Background services
    this.registerPermission({ name: "bg_orchestrator", domain: "background_services", description: "Allows triggering or scheduling micro-interval service loop daemons.", defaultGranted: true });

    // Developer tools
    this.registerPermission({ name: "verbose_diagnostics", domain: "developer_tools", description: "Allows inspecting thread heaps, event telemetry streams, and core configuration backups.", defaultGranted: false });
  }
}
