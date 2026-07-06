export type ServiceLifetime = "singleton" | "scoped" | "transient";

export interface ServiceDescriptor {
  token: string;
  implementation: any; // Class constructor, factory function, or value
  lifetime: ServiceLifetime;
  isFactory: boolean;
  lazy: boolean;
  instance?: any; // Cached instance for singletons
}

export class DIContainer {
  private static instance: DIContainer;
  private descriptors: Map<string, ServiceDescriptor> = new Map();
  private resolutionStack: string[] = []; // Circular dependency detection

  private constructor() {}

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  public register<T>(
    token: string,
    implementation: any,
    lifetime: ServiceLifetime = "singleton",
    options: { isFactory?: boolean; lazy?: boolean } = {}
  ): void {
    if (this.descriptors.has(token)) {
      console.warn(`[DIContainer] Overriding service token [${token}]`);
    }

    this.descriptors.set(token, {
      token,
      implementation,
      lifetime,
      isFactory: options.isFactory ?? false,
      lazy: options.lazy ?? true,
    });
  }

  public resolve<T>(token: string): T {
    const desc = this.descriptors.get(token);
    if (!desc) {
      throw new Error(`[DIContainer] Cannot resolve token: ${token}. No service registered.`);
    }

    // Circular dependency check
    if (this.resolutionStack.includes(token)) {
      throw new Error(`[DIContainer] Circular dependency detected: ${this.resolutionStack.join(" -> ")} -> ${token}`);
    }

    this.resolutionStack.push(token);

    try {
      if (desc.lifetime === "singleton") {
        if (!desc.instance) {
          desc.instance = this.instantiate(desc);
        }
        return desc.instance;
      }

      // Transient or Scoped (creates a new instance)
      return this.instantiate(desc);
    } finally {
      this.resolutionStack.pop();
    }
  }

  public override(token: string, newImplementation: any): void {
    const existing = this.descriptors.get(token);
    if (!existing) {
      throw new Error(`[DIContainer] Cannot override unregistered service: ${token}`);
    }
    this.register(token, newImplementation, existing.lifetime, {
      isFactory: existing.isFactory,
      lazy: existing.lazy,
    });
  }

  public clear(): void {
    this.descriptors.clear();
    this.resolutionStack = [];
  }

  private instantiate(desc: ServiceDescriptor): any {
    const impl = desc.implementation;

    if (desc.isFactory) {
      return impl(this);
    }

    if (typeof impl === "function" && impl.prototype) {
      // It's a constructable class
      try {
        return new impl();
      } catch {
        // Fallback to calling as function if instantiation fails
        return impl();
      }
    }

    return impl; // Value type
  }
}
