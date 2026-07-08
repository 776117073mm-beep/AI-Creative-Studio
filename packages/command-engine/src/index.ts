import {
  BaseEngine,
  EngineConfigSchema,
  EventEmitter,
  globalEventBus,
} from '@ai-creative-studio/core';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const CommandEngineConfigSchema = EngineConfigSchema.extend({
  maxHistorySize: z.number().optional().default(100),
  hotkeysEnabled: z.boolean().optional().default(true),
});

type CommandEngineConfig = z.infer<typeof CommandEngineConfigSchema>;

export type CommandPriority = 'high' | 'normal' | 'low';

export interface ICommand {
  id: string;
  type: string;
  label: string;
  category: string;
  description?: string;
  aliases?: string[];
  icon?: string;
  hotkey?: string;
  priority?: CommandPriority;
  when?: (context: ICommandContext) => boolean | string;
  execute: (context: ICommandContext) => ICommandResult | Promise<ICommandResult>;
  undo?: (context: ICommandContext) => ICommandResult | Promise<ICommandResult>;
  canExecute?: (context: ICommandContext) => boolean | string;
  repeatable?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string | ((context: ICommandContext) => string);
}

export interface ICommandContext {
  projectId?: string;
  selectedNodes?: string[];
  currentTime?: number;
  selectedClips?: string[];
  selectedTrack?: string;
  activeWorkspace?: string;
  activeViewId?: string;
  [key: string]: unknown;
}

export interface ICommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  undoData?: unknown;
  error?: Error;
  showNotification?: boolean;
  notificationType?: 'success' | 'info' | 'warning' | 'error';
  nextCommand?: ICommandRequest;
}

export interface ICommandRequest {
  type: string;
  payload?: unknown;
  options?: {
    silent?: boolean;
    skipHistory?: boolean;
    priority?: CommandPriority;
    source?: string;
  };
}

export interface IHotkeyBinding {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  commandType: string;
  scope?: string;
  when?: () => boolean;
}

export interface ICommandHistory {
  id: string;
  timestamp: number;
  command: string;
  context: ICommandContext;
  undoData?: unknown;
}

export interface ICommandEvents {
  'command:executed': { command: string; result: ICommandResult };
  'command:undone': { command: string };
  'command:redone': { command: string };
  'command:failed': { command: string; error: Error };
  'hotkey:triggered': { hotkey: string; command: string };
}

export class CommandEngine extends BaseEngine {
  private commands: Map<string, ICommand> = new Map();
  private hotkeyBindings: Map<string, IHotkeyBinding> = new Map();
  private history: ICommandHistory[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number;
  private hotkeysEnabled: boolean;
  private emitter = new EventEmitter<ICommandEvents>();
  private macroStack: ICommandRequest[] = [];
  private isExecutingMacro: boolean = false;

  constructor(config: CommandEngineConfig) {
    super(CommandEngineConfigSchema.parse(config));
    this.maxHistorySize = config.maxHistorySize!;
    this.hotkeysEnabled = config.hotkeysEnabled!;
  }

  protected async onInitialize(): Promise<void> {
    this.registerCoreCommands();

    if (this.hotkeysEnabled) {
      window.addEventListener('keydown', this.handleKeyboardEvent);
    }
  }

  protected override async onDestroy(): Promise<void> {
    if (this.hotkeysEnabled) {
      window.removeEventListener('keydown', this.handleKeyboardEvent);
    }
    this.commands.clear();
    this.hotkeyBindings.clear();
    this.history = [];
  }

  registerCommand(command: ICommand): void {
    if (this.commands.has(command.type)) {
      console.warn(`Command ${command.type} already registered, overwriting`);
    }

    this.commands.set(command.type, command);

    const hotkeyBinding = this.parseHotkey(command.hotkey, command.type);
    if (hotkeyBinding) {
      this.hotkeyBindings.set(hotkeyBinding.key, hotkeyBinding);
    }
  }

  registerCommands(commands: ICommand[]): void {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  unregisterCommand(type: string): void {
    const command = this.commands.get(type);
    if (!command) return;

    if (command.hotkey) {
      this.hotkeyBindings.delete(command.hotkey.toLowerCase());
    }

    this.commands.delete(type);
  }

  getCommand(type: string): ICommand | undefined {
    return this.commands.get(type);
  }

  getCommandsByCategory(category: string): ICommand[] {
    const result: ICommand[] = [];
    this.commands.forEach(cmd => {
      if (cmd.category === category) {
        result.push(cmd);
      }
    });
    return result;
  }

  getAllCommands(): ICommand[] {
    return Array.from(this.commands.values());
  }

  async execute(
    request: ICommandRequest,
    context: ICommandContext = {}
  ): Promise<ICommandResult> {
    const command = this.commands.get(request.type);
    if (!command) {
      const result: ICommandResult = {
        success: false,
        error: new Error(`Unknown command: ${request.type}`),
      };
      this.emitter.emit('command:failed', {
        command: request.type,
        error: result.error!,
      });
      return result;
    }

    const canExecute = command.canExecute
      ? command.canExecute(context)
      : true;

    if (canExecute !== true && canExecute !== 'enabled') {
      const msg = typeof canExecute === 'string' ? canExecute : 'Command cannot be executed in current context';
      return { success: false, message: msg };
    }

    try {
      const result = await command.execute(context);

      if (result.success && command.undo && !request.options?.skipHistory) {
        this.addToHistory({
          id: uuidv4(),
          timestamp: Date.now(),
          command: request.type,
          context,
          undoData: result.undoData,
        });
      }

      if (!request.options?.silent) {
        this.emitter.emit('command:executed', {
          command: request.type,
          result,
        });
      }

      return result;
    } catch (error) {
      const result: ICommandResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
      this.emitter.emit('command:failed', {
        command: request.type,
        error: result.error,
      });
      return result;
    }
  }

  async undo(context: ICommandContext = {}): Promise<ICommandResult | null> {
    if (this.historyIndex < 0) return null;

    const historyItem = this.history[this.historyIndex];
    const command = this.commands.get(historyItem.command);

    if (!command?.undo) return null;

    try {
      const result = await command.undo({
        ...context,
        ...historyItem.context,
        undoData: historyItem.undoData,
      });

      if (result.success) {
        this.historyIndex--;
        this.emitter.emit('command:undone', { command: historyItem.command });
      }

      return result;
    } catch (error) {
      const result: ICommandResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
      return result;
    }
  }

  async redo(context: ICommandContext = {}): Promise<ICommandResult | null> {
    if (this.historyIndex >= this.history.length - 1) return null;

    const nextIndex = this.historyIndex + 1;
    const historyItem = this.history[nextIndex];
    const command = this.commands.get(historyItem.command);

    if (!command) return null;

    const newContext = { ...context, ...historyItem.context };
    const canExecute = command.canExecute
      ? command.canExecute(newContext)
      : true;

    if (canExecute !== true && canExecute !== 'enabled') {
      return {
        success: false,
        message: 'Command cannot be redone in current context',
      };
    }

    try {
      const result = await command.execute(newContext);

      if (result.success) {
        this.historyIndex = nextIndex;
        this.emitter.emit('command:redone', { command: historyItem.command });
      }

      return result;
    } catch (error) {
      const result: ICommandResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
      return result;
    }
  }

  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  getHistory(): ICommandHistory[] {
    return [...this.history];
  }

  getHistoryIndex(): number {
    return this.historyIndex;
  }

  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }

  registerHotkey(hotkey: string, commandType: string): void {
    const binding = this.parseHotkey(hotkey, commandType);
    if (binding) {
      this.hotkeyBindings.set(hotkey.toLowerCase(), binding);
    }
  }

  unregisterHotkey(hotkey: string): void {
    this.hotkeyBindings.delete(hotkey.toLowerCase());
  }

  getHotkeyBindings(): IHotkeyBinding[] {
    return Array.from(this.hotkeyBindings.values());
  }

  beginMacro(): void {
    this.macroStack = [];
    this.isExecutingMacro = true;
  }

  addToMacro(request: ICommandRequest): void {
    if (!this.isExecutingMacro) return;
    this.macroStack.push(request);
  }

  endMacro(): ICommandRequest[] {
    this.isExecutingMacro = false;
    return [...this.macroStack];
  }

  async executeMacro(
    requests: ICommandRequest[],
    context: ICommandContext
  ): Promise<ICommandResult[]> {
    const results: ICommandResult[] = [];
    beginUndoGroup: {
      for (const request of requests) {
        const result = await this.execute(request, context);
        results.push(result);
        if (!result.success) {
          break beginUndoGroup;
        }
      }
    }
    return results;
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (event.repeat) return;

    const modifiers: IHotkeyBinding['modifiers'] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    const key = event.key.toLowerCase();
    const bindingKey = [...modifiers, key].join('+');

    const binding = this.hotkeyBindings.get(bindingKey) ||
                    this.hotkeyBindings.get(event.key);

    if (binding && (!binding.when || binding.when())) {
      event.preventDefault();
      event.stopPropagation();

      this.execute({ type: binding.commandType }, {}).then(result => {
        this.emitter.emit('hotkey:triggered', {
          hotkey: bindingKey,
          command: binding.commandType,
        });
      });
    }
  };

  private parseHotkey(
    hotkey: string | undefined,
    commandType: string
  ): IHotkeyBinding | null {
    if (!hotkey) return null;

    const parts = hotkey.toLowerCase().split('+');
    const modifiers: IHotkeyBinding['modifiers'] = [];
    let key = '';

    for (const part of parts) {
      if (['ctrl', 'alt', 'shift', 'meta'].includes(part)) {
        modifiers.push(part as any);
      } else {
        key = part;
      }
    }

    return {
      key: [...modifiers, key].join('+'),
      modifiers,
      commandType,
    };
  }

  private addToHistory(item: ICommandHistory): void {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(item);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    this.historyIndex = this.history.length - 1;
  }

  private registerCoreCommands(): void {
    this.registerCommand({
      id: 'core:undo',
      type: 'core:undo',
      label: 'Undo',
      category: 'Core',
      hotkey: 'ctrl+z',
      execute: async () => {
        const result = await this.undo({});
        return result ?? { success: false, message: 'Nothing to undo' };
      },
    });

    this.registerCommand({
      id: 'core:redo',
      type: 'core:redo',
      label: 'Redo',
      category: 'Core',
      hotkey: 'ctrl+shift+z',
      execute: async () => {
        const result = await this.redo({});
        return result ?? { success: false, message: 'Nothing to redo' };
      },
    });

    this.registerCommand({
      id: 'core:copy',
      type: 'core:copy',
      label: 'Copy',
      category: 'Edit',
      hotkey: 'ctrl+c',
      execute: async (context) => {
        return { success: true, message: 'Copied to clipboard' };
      },
    });

    this.registerCommand({
      id: 'core:paste',
      type: 'core:paste',
      label: 'Paste',
      category: 'Edit',
      hotkey: 'ctrl+v',
      execute: async (context) => {
        return { success: true, message: 'Pasted from clipboard' };
      },
    });

    this.registerCommand({
      id: 'core:delete',
      type: 'core:delete',
      label: 'Delete',
      category: 'Edit',
      hotkey: 'delete',
      execute: async (context) => {
        return { success: true, message: 'Deleted selection' };
      },
    });
  }

  on<E extends keyof ICommandEvents>(
    event: E,
    listener: (data: ICommandEvents[E]) => void
  ): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  off<E extends keyof ICommandEvents>(
    event: E,
    listener: (data: ICommandEvents[E]) => void
  ): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  getCapabilities(): string[] {
    return [
      'command:register',
      'command:execute',
      'command:undo',
      'command:redo',
      'command:history',
      'command:hotkeys',
      'command:macros',
    ];
  }
}
