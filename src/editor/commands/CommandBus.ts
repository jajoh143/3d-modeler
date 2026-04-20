import type { Command, CommandContext } from "./types";

export class CommandBus {
  private stack: Command[] = [];
  private pointer = -1;

  constructor(
    private readonly ctx: CommandContext,
    private readonly onChange: () => void,
  ) {}

  execute(cmd: Command): void {
    cmd.execute(this.ctx);
    this.stack.length = this.pointer + 1;
    this.stack.push(cmd);
    this.pointer += 1;
    this.onChange();
  }

  /** Push a command that has already been applied externally (e.g. gizmo drag). */
  pushExecuted(cmd: Command): void {
    this.stack.length = this.pointer + 1;
    this.stack.push(cmd);
    this.pointer += 1;
    this.onChange();
  }

  undo(): void {
    if (this.pointer < 0) return;
    this.stack[this.pointer].undo(this.ctx);
    this.pointer -= 1;
    this.onChange();
  }

  redo(): void {
    if (this.pointer >= this.stack.length - 1) return;
    this.pointer += 1;
    this.stack[this.pointer].execute(this.ctx);
    this.onChange();
  }

  clear(): void {
    this.stack = [];
    this.pointer = -1;
    this.onChange();
  }

  canUndo(): boolean {
    return this.pointer >= 0;
  }
  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }
}
