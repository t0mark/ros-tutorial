import { XtermTerminal } from '../terminal/xterm-terminal.js';

/**
 * 터미널 분할 관리자 (Flat list 방식)
 *
 * Ctrl+Shift+E  → 터미널 추가 (전체를 n등분)
 * Ctrl+D        → 현재 터미널 닫기
 * Alt+←/→      → 터미널 포커스 이동
 */
export class SplitManager {
  constructor(container, onTurtlesimNodeStart) {
    this._container = container;
    this._onTurtlesimNodeStart = onTurtlesimNodeStart;
    this._panes = [];
    this._focusIdx = -1;
    this._counter = 0;

    // 초기 터미널 1개
    this._addPane();

    // 전역 단축키
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this._addPane();
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this._closePane();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        this._shiftFocus(+1);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        this._shiftFocus(-1);
      }
    });
  }

  /* ── 페인 추가 ────────────────────────────────────────── */
  _addPane() {
    const id = ++this._counter;
    const el = document.createElement('div');
    el.className = 'split-pane';

    const label = document.createElement('div');
    label.className = 'pane-label';
    label.innerHTML =
      `<span class="pane-label-dot"></span>Terminal ${id}` +
      `<span class="pane-shortcuts">` +
      `Ctrl+Shift+E: 추가 &nbsp;|&nbsp; Ctrl+D: 닫기 &nbsp;|&nbsp; Alt+←→: 이동` +
      `</span>`;

    const termContainer = document.createElement('div');
    termContainer.className = 'term-container';

    el.appendChild(label);
    el.appendChild(termContainer);

    const terminal = new XtermTerminal(termContainer, this._onTurtlesimNodeStart);

    // 단축키를 xterm이 처리하지 않도록 차단
    terminal.interceptKeys(e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') return false;
      if (e.ctrlKey && e.key === 'd') return false;
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return false;
      return true;
    });

    const pane = { id, el, terminal };
    this._panes.push(pane);
    this._container.appendChild(el);

    // 클릭 시 포커스
    termContainer.addEventListener('mousedown', () =>
      this._focusByIndex(this._panes.indexOf(pane)));
    label.addEventListener('mousedown', () =>
      this._focusByIndex(this._panes.indexOf(pane)));

    this._redistribute();
    this._focusByIndex(this._panes.length - 1);
  }

  /* ── 현재 페인 닫기 ───────────────────────────────────── */
  _closePane() {
    if (this._panes.length <= 1) return; // 최소 1개 유지
    const idx = this._focusIdx;
    if (idx < 0) return;

    const pane = this._panes[idx];
    pane.terminal.destroy();
    this._container.removeChild(pane.el);
    this._panes.splice(idx, 1);

    const newIdx = Math.min(idx, this._panes.length - 1);
    this._focusIdx = -1;
    this._redistribute();
    this._focusByIndex(newIdx);
  }

  /* ── 포커스 이동 ──────────────────────────────────────── */
  _shiftFocus(delta) {
    if (!this._panes.length) return;
    const next = (this._focusIdx + delta + this._panes.length) % this._panes.length;
    this._focusByIndex(next);
  }

  _focusByIndex(idx) {
    if (idx < 0 || idx >= this._panes.length) return;
    if (this._focusIdx >= 0 && this._focusIdx < this._panes.length) {
      this._panes[this._focusIdx].el.classList.remove('focused');
    }
    this._focusIdx = idx;
    this._panes[idx].el.classList.add('focused');
    // CSS 테두리 + 실제 키보드 입력 포커스 모두 이동
    setTimeout(() => {
      const pane = this._panes[idx];
      if (!pane) return;
      pane.terminal.fit();
      pane.terminal.focus();
    }, 20);
  }

  /* ── 전체 폭을 n등분으로 재분배 ──────────────────────── */
  _redistribute() {
    const n = this._panes.length;
    const pct = (100 / n).toFixed(4);
    this._panes.forEach(p => { p.el.style.flex = `0 0 ${pct}%`; });
    setTimeout(() => this._fitAll(), 60);
  }

  _fitAll() {
    this._panes.forEach(p => { try { p.terminal.fit(); } catch {} });
  }
}
