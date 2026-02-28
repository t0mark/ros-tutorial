import { exercises, Exercise, Step } from '../exercises/data';

export class TutorialPanel {
  private container: HTMLElement;
  private currentExercise: Exercise = exercises[0];
  private currentStep = 0;
  onExerciseChange?: (exerciseId: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    const ex = this.currentExercise;

    this.container.innerHTML = `
      <div class="tutorial-inner">
        <div class="exercise-tabs">
          ${exercises.map(e => `
            <button class="exercise-tab ${e.id === ex.id ? 'active' : ''}" data-id="${e.id}">
              ${e.title}<br><span>${e.subtitle}</span>
            </button>
          `).join('')}
        </div>
        <div class="steps-container">
          ${ex.steps.map((step, i) => this.renderStep(step, i)).join('')}
        </div>
      </div>
    `;

    // Tab clicks
    this.container.querySelectorAll<HTMLButtonElement>('.exercise-tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchExercise(btn.dataset.id!));
    });

    // Step header clicks
    this.container.querySelectorAll<HTMLElement>('.step-header').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index!, 10);
        this.currentStep = idx;
        this.render();
      });
    });

    // Copy buttons
    this.container.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const code = btn.dataset.code!;
        navigator.clipboard.writeText(code).catch(() => {
          // Fallback for non-HTTPS
          const el = document.createElement('textarea');
          el.value = code;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        });
        btn.textContent = '✓ 복사됨';
        setTimeout(() => { btn.textContent = '복사'; }, 1500);
      });
    });

    // Next/Prev buttons
    this.container.querySelector('.next-btn')?.addEventListener('click', () => {
      if (this.currentStep < this.currentExercise.steps.length - 1) {
        this.currentStep++;
        this.render();
        this.scrollToActive();
      }
    });
    this.container.querySelector('.prev-btn')?.addEventListener('click', () => {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.render();
        this.scrollToActive();
      }
    });

    this.scrollToActive();
  }

  private renderStep(step: Step, index: number): string {
    const isActive = index === this.currentStep;
    const isDone = index < this.currentStep;
    const statusClass = isActive ? 'active' : isDone ? 'done' : '';
    const termHint = step.terminalHint
      ? `<span class="term-hint">Terminal ${step.terminalHint}</span>`
      : '';

    const bodyHtml = isActive
      ? `
        <div class="step-body">
          ${step.code ? `
            <div class="code-block">
              <code>${escapeHtml(step.code)}</code>
              <button class="copy-btn" data-code="${escapeAttr(step.code)}">복사</button>
            </div>
          ` : ''}
          ${step.detail ? `
            <p class="step-detail">${escapeHtml(step.detail).replace(/\n/g, '<br>')}</p>
          ` : ''}
          <div class="step-nav">
            ${index > 0 ? '<button class="nav-btn prev-btn">← 이전</button>' : ''}
            ${index < this.currentExercise.steps.length - 1
              ? '<button class="nav-btn next-btn">다음 →</button>'
              : '<span class="done-badge">✓ 완료!</span>'}
          </div>
        </div>
      `
      : '';

    return `
      <div class="step ${statusClass}">
        <div class="step-header" data-index="${index}">
          <span class="step-num">${isDone ? '✓' : index + 1}</span>
          <span class="step-text">${escapeHtml(step.text)}</span>
          ${termHint}
        </div>
        ${bodyHtml}
      </div>
    `;
  }

  private scrollToActive(): void {
    setTimeout(() => {
      const activeEl = this.container.querySelector('.step.active');
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  private switchExercise(id: string): void {
    const ex = exercises.find(e => e.id === id);
    if (ex && ex.id !== this.currentExercise.id) {
      this.currentExercise = ex;
      this.currentStep = 0;
      this.render();
      this.onExerciseChange?.(id);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;');
}
