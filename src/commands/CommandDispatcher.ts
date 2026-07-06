import { Command, CommandResult, ICommandDispatcher } from "../interfaces";

export class CommandDispatcher implements ICommandDispatcher {
  private static instance: CommandDispatcher;
  private handlers: Map<string, (command: Command) => Promise<any>> = new Map();
  private undoHandlers: Map<string, (command: Command) => Promise<any>> = new Map();
  
  private activeQueue: Command[] = [];
  private executionHistory: Command[] = [];
  
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  
  private maxHistorySize = 500;

  constructor() {}

  public static getInstance(): CommandDispatcher {
    if (!CommandDispatcher.instance) {
      CommandDispatcher.instance = new CommandDispatcher();
    }
    return CommandDispatcher.instance;
  }

  public registerHandler(
    commandName: string, 
    handler: (command: Command) => Promise<any>,
    undoHandler?: (command: Command) => Promise<any>
  ): void {
    this.handlers.set(commandName, handler);
    if (undoHandler) {
      this.undoHandlers.set(commandName, undoHandler);
    }
  }

  public unregisterHandler(commandName: string): void {
    this.handlers.delete(commandName);
    this.undoHandlers.delete(commandName);
  }

  public async dispatch(commandInput: Omit<Command, "id" | "timestamp">): Promise<CommandResult> {
    const commandId = "cmd_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const command: Command = {
      ...commandInput,
      id: commandId,
      timestamp: Date.now()
    };

    console.log(`[CommandDispatcher] Dispatching command: ${command.name}`, command);

    // 1. Validation
    if (!command.name || !command.payload) {
      return {
        commandId,
        success: false,
        error: "Validation failed: Command name and payload are required."
      };
    }

    // 2. Authorization (simulation of user/module credentials check)
    const requiredPermission = command.metadata?.requiredPermission;
    if (requiredPermission) {
      const activePermissions: string[] = command.metadata?.userPermissions || ["basic"];
      if (!activePermissions.includes(requiredPermission)) {
        return {
          commandId,
          success: false,
          error: `Authorization failed: Missing required permission [${requiredPermission}].`
        };
      }
    }

    // 3. Queue & Sort by Priority (higher number = higher priority)
    this.activeQueue.push(command);
    this.activeQueue.sort((a, b) => b.priority - a.priority);

    // 4. Execution
    const handler = this.handlers.get(command.name);
    if (!handler) {
      this.activeQueue = this.activeQueue.filter(cmd => cmd.id !== commandId);
      return {
        commandId,
        success: false,
        error: `No registered handler found for command: ${command.name}`
      };
    }

    try {
      // Simulate running state/progress
      const resultData = await handler(command);
      
      // Remove from active queue
      this.activeQueue = this.activeQueue.filter(cmd => cmd.id !== commandId);
      
      // Save to history log
      this.executionHistory.push(command);
      if (this.executionHistory.length > this.maxHistorySize) {
        this.executionHistory.shift();
      }

      // Check if command is undoable
      if (this.undoHandlers.has(command.name)) {
        this.undoStack.push(command);
        // Clear redo stack on new command execution
        this.redoStack = [];
      }

      return {
        commandId,
        success: true,
        data: resultData,
        progress: 100
      };
    } catch (err: any) {
      this.activeQueue = this.activeQueue.filter(cmd => cmd.id !== commandId);
      console.error(`[CommandDispatcher] Execution failed for command: ${command.name}`, err);
      return {
        commandId,
        success: false,
        error: err?.message || "Execution exception occurred."
      };
    }
  }

  public async undo(): Promise<boolean> {
    const lastCommand = this.undoStack.pop();
    if (!lastCommand) {
      console.warn("[CommandDispatcher] No commands in undo stack.");
      return false;
    }

    const undoHandler = this.undoHandlers.get(lastCommand.name);
    if (!undoHandler) {
      console.error(`[CommandDispatcher] Missing undo handler for: ${lastCommand.name}`);
      return false;
    }

    try {
      console.log(`[CommandDispatcher] Reverting (undo) command: ${lastCommand.name}`);
      await undoHandler(lastCommand);
      this.redoStack.push(lastCommand);
      return true;
    } catch (err) {
      console.error(`[CommandDispatcher] Undo failed for command: ${lastCommand.name}`, err);
      // Restore stack integrity
      this.undoStack.push(lastCommand);
      return false;
    }
  }

  public async redo(): Promise<boolean> {
    const lastCommand = this.redoStack.pop();
    if (!lastCommand) {
      console.warn("[CommandDispatcher] No commands in redo stack.");
      return false;
    }

    const handler = this.handlers.get(lastCommand.name);
    if (!handler) {
      console.error(`[CommandDispatcher] Missing handler to redo command: ${lastCommand.name}`);
      return false;
    }

    try {
      console.log(`[CommandDispatcher] Re-applying (redo) command: ${lastCommand.name}`);
      await handler(lastCommand);
      this.undoStack.push(lastCommand);
      return true;
    } catch (err) {
      console.error(`[CommandDispatcher] Redo failed for command: ${lastCommand.name}`, err);
      // Restore stack integrity
      this.redoStack.push(lastCommand);
      return false;
    }
  }

  public async cancel(commandId: string): Promise<boolean> {
    const lengthBefore = this.activeQueue.length;
    this.activeQueue = this.activeQueue.filter(cmd => cmd.id !== commandId);
    
    if (this.activeQueue.length < lengthBefore) {
      console.log(`[CommandDispatcher] Cancelled queued command: ${commandId}`);
      return true;
    }
    
    console.warn(`[CommandDispatcher] Active command with ID: ${commandId} could not be located in queue.`);
    return false;
  }

  public getHistory(): Command[] {
    return [...this.executionHistory];
  }

  public getActiveQueue(): Command[] {
    return [...this.activeQueue];
  }

  public clearAll(): void {
    this.handlers.clear();
    this.undoHandlers.clear();
    this.activeQueue = [];
    this.executionHistory = [];
    this.undoStack = [];
    this.redoStack = [];
  }
}
