import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand, ProcessMode } from '../ros2/command-executor';
import { TurtlesimNode } from '../ros2/nodes/turtlesim-node';

const PROMPT_STR = '\x1b[32muser@ros2\x1b[0m:\x1b[34m~\x1b[0m$ ';

export class XtermTerminal {
  readonly xterm: Terminal;
  private fitAddon: FitAddon;
  private buffer = '';
  private history: string[] = [];
  private historyIdx = -1;
  private processMode: ProcessMode | null = null;

  onTurtlesimNodeStart?: (node: TurtlesimNode) => void;

  constructor(container: HTMLElement) {
    this.xterm = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#264f78',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
      fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 2000,
      allowTransparency: false,
    });

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);
    this.xterm.open(container);

    // Show welcome message
    this.xterm.writeln('\x1b[1;36m╔════════════════════════════════════╗\x1b[0m');
    this.xterm.writeln('\x1b[1;36m║   ROS2 실습 터미널 (시뮬레이션)    ║\x1b[0m');
    this.xterm.writeln('\x1b[1;36m╚════════════════════════════════════╝\x1b[0m');
    this.xterm.writeln('\x1b[90mROS2 Humble Hawksbill (simulated)\x1b[0m');
    this.xterm.writeln('');
    this.writePrompt();

    this.xterm.onData(data => this.handleData(data));

    const ro = new ResizeObserver(() => {
      try { this.fitAddon.fit(); } catch { /* ignore */ }
    });
    ro.observe(container);
  }

  private handleData(data: string): void {
    // Process mode: forward input to running process
    if (this.processMode !== null) {
      if (data === '\x03') {
        // Ctrl+C: kill process
        this.xterm.write('^C\r\n');
        this.killProcess(false);
        return;
      }
      if (this.processMode.onKey) {
        const cont = this.processMode.onKey(data);
        if (!cont) {
          this.killProcess(false);
        }
        return;
      }
      // No key handler, just wait for Ctrl+C
      return;
    }

    // Normal mode: line editing
    if (data === '\r') {
      this.xterm.write('\r\n');
      const cmd = this.buffer.trim();
      if (cmd) {
        this.history.unshift(cmd);
        if (this.history.length > 100) this.history.pop();
        this.historyIdx = -1;
      }
      this.buffer = '';

      if (cmd) {
        executeCommand(
          cmd,
          (line) => this.writeln(line),
          (mode) => this.startProcess(mode),
          (node) => this.onTurtlesimNodeStart?.(node),
        );
      }

      if (this.processMode === null) {
        this.writePrompt();
      }
    } else if (data === '\x7f') {
      // Backspace
      if (this.buffer.length > 0) {
        this.buffer = this.buffer.slice(0, -1);
        this.xterm.write('\b \b');
      }
    } else if (data === '\x03') {
      // Ctrl+C in idle mode
      this.xterm.write('^C');
      this.buffer = '';
      this.historyIdx = -1;
      this.writePrompt();
    } else if (data === '\x1b[A') {
      // Up arrow: history prev
      if (this.historyIdx < this.history.length - 1) {
        this.historyIdx++;
        this.replaceBuffer(this.history[this.historyIdx]);
      }
    } else if (data === '\x1b[B') {
      // Down arrow: history next
      if (this.historyIdx > 0) {
        this.historyIdx--;
        this.replaceBuffer(this.history[this.historyIdx]);
      } else if (this.historyIdx === 0) {
        this.historyIdx = -1;
        this.replaceBuffer('');
      }
    } else if (data === '\x1b[C' || data === '\x1b[D') {
      // Left/right arrows: ignore for simplicity
    } else if (data >= ' ' || data === '\t') {
      // Printable characters
      this.buffer += data;
      this.xterm.write(data);
    }
  }

  private replaceBuffer(text: string): void {
    // Move to start, clear line, rewrite prompt + text
    this.xterm.write('\r\x1b[K');
    this.xterm.write(PROMPT_STR);
    this.buffer = text;
    this.xterm.write(text);
  }

  private writePrompt(): void {
    this.xterm.write('\r\n' + PROMPT_STR);
  }

  writeln(line: string): void {
    this.xterm.writeln(line);
  }

  private startProcess(mode: ProcessMode): void {
    this.processMode = mode;
  }

  private killProcess(addNewline: boolean): void {
    if (this.processMode === null) return;
    this.processMode.node.stop();
    this.processMode = null;
    if (addNewline) this.xterm.write('\r\n');
    this.writePrompt();
  }

  fit(): void {
    try { this.fitAddon.fit(); } catch { /* ignore */ }
  }
}
