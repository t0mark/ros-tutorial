// xterm.js ESM — jsDelivr CDN (Node.js/빌드 불필요)
import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm';
import { FitAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/+esm';
import { executeCommand } from '../ros2/command-executor.js';

const PROMPT = '\x1b[32muser@ros2\x1b[0m:\x1b[34m~\x1b[0m$ ';

export class XtermTerminal {
  constructor(container, onTurtlesimNodeStart) {
    this._onTurtlesimNodeStart = onTurtlesimNodeStart;
    this._buffer = '';
    this._history = [];
    this._histIdx = -1;
    this._process = null; // { node, onKey? }

    this._term = new Terminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        green: '#3fb950',
        red: '#ff7b72',
        yellow: '#d29922',
        blue: '#58a6ff',
        cyan: '#39c5cf',
      },
      fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 2000,
    });

    this._fitAddon = new FitAddon();
    this._term.loadAddon(this._fitAddon);
    this._term.open(container);

    this._term.writeln('\x1b[1;36m╔════════════════════════════════════╗\x1b[0m');
    this._term.writeln('\x1b[1;36m║   ROS2 실습 터미널 (시뮬레이션)    ║\x1b[0m');
    this._term.writeln('\x1b[1;36m╚════════════════════════════════════╝\x1b[0m');
    this._term.writeln('\x1b[90mROS2 Humble Hawksbill (simulated)\x1b[0m');
    this._term.writeln('');
    this._writePrompt();

    this._term.onData(data => this._handleData(data));

    this._ro = new ResizeObserver(() => { try { this._fitAddon.fit(); } catch {} });
    this._ro.observe(container);
  }

  _handleData(data) {
    // ── 프로세스 실행 중 ──────────────────────────────────
    if (this._process) {
      if (data === '\x03') {              // Ctrl+C
        this._term.write('^C\r\n');
        this._kill();
        return;
      }
      if (this._process.onKey) {
        const cont = this._process.onKey(data);
        if (!cont) { this._kill(); }
        return;
      }
      return;
    }

    // ── 일반 라인 편집 ────────────────────────────────────
    if (data === '\r') {
      this._term.write('\r\n');
      const cmd = this._buffer.trim();
      if (cmd) { this._history.unshift(cmd); this._histIdx = -1; }
      this._buffer = '';
      if (cmd === 'clear') {
        this._term.clear();
      } else if (cmd) {
        executeCommand(
          cmd,
          line => this._term.writeln(line),
          mode => {
            this._process = mode;
            // 외부 종료(ros2 node kill 등) 시 터미널 자동 복구
            if (mode?.node) {
              const prev = mode.node.onStopped;
              mode.node.onStopped = () => {
                if (prev) prev();
                if (this._process?.node === mode.node) {
                  this._process = null;
                  this._writePrompt();
                }
              };
            }
          },
          node => { if (this._onTurtlesimNodeStart) this._onTurtlesimNodeStart(node, () => this._kill()); }
        );
      }
      if (!this._process) this._writePrompt();
    } else if (data === '\x7f') {
      if (this._buffer.length) { this._buffer = this._buffer.slice(0, -1); this._term.write('\b \b'); }
    } else if (data === '\x03') {
      this._term.write('^C'); this._buffer = ''; this._histIdx = -1; this._writePrompt();
    } else if (data === '\x1b[A') {       // 위 ↑ 히스토리
      if (this._histIdx < this._history.length - 1) {
        this._histIdx++;
        this._replaceBuffer(this._history[this._histIdx]);
      }
    } else if (data === '\x1b[B') {       // 아래 ↓ 히스토리
      if (this._histIdx > 0) { this._histIdx--; this._replaceBuffer(this._history[this._histIdx]); }
      else if (this._histIdx === 0) { this._histIdx = -1; this._replaceBuffer(''); }
    } else if (data === '\x1b[C' || data === '\x1b[D') {
      // 좌우 방향키 무시
    } else if (data >= ' ') {
      this._buffer += data;
      this._term.write(data);
    }
  }

  _replaceBuffer(text) {
    this._term.write('\r\x1b[K' + PROMPT);
    this._buffer = text;
    this._term.write(text);
  }

  _writePrompt() {
    this._term.write('\r\n' + PROMPT);
  }

  _kill() {
    if (!this._process) return;
    this._process.node.stop();
    this._process = null;
    this._writePrompt();
  }

  fit() {
    try { this._fitAddon.fit(); } catch {}
  }

  focus() {
    this._term.focus();
  }

  // xterm 키 이벤트 가로채기 (split 단축키 등록용)
  interceptKeys(fn) {
    this._term.attachCustomKeyEventHandler(fn);
  }

  // 터미널 페인 제거 시 호출 — 프로세스 종료 + xterm 정리
  destroy() {
    this._kill();
    try { this._ro.disconnect(); } catch {}
    try { this._term.dispose(); }  catch {}
  }
}
