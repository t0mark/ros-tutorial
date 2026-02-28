import { exercises } from '../content/exercises.js';

export class TutorialPanel {
  constructor(container) {
    this._container = container;
    this._ex   = exercises[0];
    this._step = 0;
    this._render();
  }

  _render() {
    const ex = this._ex;
    this._container.innerHTML = `
      <div class="tutorial-inner">
        <div class="exercise-tabs">
          ${exercises.map(e => `
            <button class="exercise-tab ${e.id === ex.id ? 'active' : ''}" data-id="${e.id}">
              ${e.title}<br><span>${e.subtitle}</span>
            </button>`).join('')}
        </div>
        <div class="steps-container">
          ${ex.steps.map((s, i) => this._renderStep(s, i)).join('')}
        </div>
      </div>`;

    // 탭 클릭
    this._container.querySelectorAll('.exercise-tab').forEach(btn =>
      btn.addEventListener('click', () => {
        const e = exercises.find(x => x.id === btn.dataset.id);
        if (e && e.id !== this._ex.id) { this._ex = e; this._step = 0; this._render(); }
      }));

    // 스텝 클릭
    this._container.querySelectorAll('.step-header').forEach(el =>
      el.addEventListener('click', () => {
        this._step = +el.dataset.index;
        this._render();
      }));

    // 복사 버튼
    this._container.querySelectorAll('.copy-btn').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const code = btn.dataset.code;
        navigator.clipboard?.writeText(code).catch(() => {
          const el = Object.assign(document.createElement('textarea'), { value: code });
          document.body.appendChild(el); el.select(); document.execCommand('copy');
          document.body.removeChild(el);
        });
        btn.textContent = '✓ 복사됨';
        setTimeout(() => btn.textContent = '복사', 1500);
      }));

    // 다음/이전
    this._container.querySelector('.next-btn')?.addEventListener('click', () => {
      if (this._step < this._ex.steps.length - 1) { this._step++; this._render(); }
    });
    this._container.querySelector('.prev-btn')?.addEventListener('click', () => {
      if (this._step > 0) { this._step--; this._render(); }
    });

    // 현재 스텝으로 스크롤
    setTimeout(() => this._container.querySelector('.step.active')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  _renderStep(step, i) {
    const isActive = i === this._step;
    const isDone   = i <  this._step;
    const cls = isActive ? 'active' : isDone ? 'done' : '';
    const hint = step.terminalHint
      ? `<span class="term-hint">Terminal ${step.terminalHint}</span>` : '';
    const body = (step.code || step.detail || isActive) ? `
      <div class="step-body">
        ${step.code ? `
          <div class="code-block">
            <code>${esc(step.code)}</code>
            <button class="copy-btn" data-code="${escAttr(step.code)}">복사</button>
          </div>` : ''}
        ${step.detail ? `<p class="step-detail">${esc(step.detail).replace(/\n/g,'<br>')}</p>` : ''}
        ${isActive ? `
        <div class="step-nav">
          ${i > 0 ? '<button class="nav-btn prev-btn">← 이전</button>' : ''}
          ${i < this._ex.steps.length - 1
            ? '<button class="nav-btn next-btn">다음 →</button>'
            : '<span class="done-badge">✓ 완료!</span>'}
        </div>` : ''}
      </div>` : '';

    return `
      <div class="step ${cls}">
        <div class="step-header" data-index="${i}">
          <span class="step-num">${isDone ? '✓' : i + 1}</span>
          <span class="step-text">${esc(step.text)}</span>
          ${hint}
        </div>
        ${body}
      </div>`;
  }
}

const esc     = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => s.replace(/"/g,'&quot;');
