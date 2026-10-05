import { createKanaQuiz, missedKanaIds } from '../lib/kana-practice.js';
import { gradeQuiz, shuffle } from '../lib/quiz.js';
import { recordScore } from '../lib/progress.js';

const groupNames = {
  basic: 'Cơ bản',
  voiced: 'Âm đục / bán đục',
  combined: 'Âm ghép',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function renderKanaView({ script, tables, progress, onProgress }) {
  const section = document.createElement('section');
  section.className = 'kana-view';
  let activeGroup = 'basic';
  let mode = 'kana-to-romaji';
  let selectedKana = tables[script].basic[0].kana;
  let quizState = null;
  let currentProgress = progress;

  const updateProgress = (next) => {
    currentProgress = next;
    onProgress(next);
  };

  function renderQuiz() {
    if (!quizState) return '';
    if (quizState.result) {
      const missed = new Set(missedKanaIds(quizState.questions, quizState.answers));
      return `
        <div class="quiz-result" role="status">
          <p class="eyebrow">BÀI KIỂM TRA HOÀN TẤT</p>
          <h3>${quizState.result.correct} / ${quizState.result.total} câu đúng</h3>
          <div class="score-line"><span>Điểm lần này</span><strong>${quizState.result.percent}%</strong></div>
          <p>${missed.size ? `Cần ôn lại: ${[...missed].join('、')}` : 'Tuyệt vời, bạn đã trả lời đúng tất cả.'}</p>
          <div class="quiz-actions"><button class="secondary-button" data-action="retry-quiz">Làm lại</button><button class="primary-button" data-action="close-quiz">Đóng kết quả</button></div>
        </div>`;
    }
    const question = quizState.questions[quizState.index];
    if (!question) return '';
    const selected = quizState.answers[question.id];
    return `
      <div class="quiz-panel" aria-live="polite">
        <div class="quiz-progress"><span>CÂU ${quizState.index + 1} / ${quizState.questions.length}</span><span class="quiz-track"><i style="width:${((quizState.index + 1) / quizState.questions.length) * 100}%"></i></span></div>
        <p class="eyebrow">${mode === 'kana-to-romaji' ? 'NHẬN DIỆN KÝ TỰ' : 'NHẬN DIỆN ÂM ĐỌC'}</p>
        <h3 class="quiz-prompt">${escapeHtml(question.prompt)}</h3>
        <div class="quiz-options" role="group" aria-label="Chọn một đáp án">
          ${question.options.map((option, index) => `<button class="quiz-option ${selected === option.id ? 'is-selected' : ''}" data-action="select-answer" data-option="${escapeHtml(option.id)}" aria-pressed="${selected === option.id}"><span class="option-key">${String.fromCharCode(65 + index)}</span>${escapeHtml(option.text)}</button>`).join('')}
        </div>
        <div class="quiz-actions"><button class="secondary-button" data-action="cancel-quiz">Thoát bài kiểm tra</button><button class="primary-button" data-action="next-question" ${selected ? '' : 'disabled'}>${quizState.index === quizState.questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <span aria-hidden="true">→</span></button></div>
      </div>`;
  }

  function render() {
    const table = tables[script];
    const entries = table[activeGroup];
    const focus = entries.find((item) => item.kana === selectedKana) ?? entries[0];
    const saved = currentProgress.scores[`kana:${script}`];
    section.innerHTML = `
      <div class="view-intro">
        <div><p class="eyebrow">NỀN TẢNG TIẾNG NHẬT</p><h1>${script === 'hiragana' ? 'HIRAGANA' : 'KATAKANA'}</h1><p>Học từng ký tự, nghe âm trong đầu và kiểm tra trí nhớ của bạn.</p></div>
        <div class="kana-big-mark" aria-hidden="true">${script === 'hiragana' ? 'あ' : 'ア'}</div>
      </div>
      <div class="study-toolbar">
        <div class="segmented-control" role="group" aria-label="Chọn bảng chữ cái">
          <a href="#/kana/hiragana" class="segment ${script === 'hiragana' ? 'is-active' : ''}" ${script === 'hiragana' ? 'aria-current="page"' : ''}>Hiragana</a>
          <a href="#/kana/katakana" class="segment ${script === 'katakana' ? 'is-active' : ''}" ${script === 'katakana' ? 'aria-current="page"' : ''}>Katakana</a>
        </div>
        <div class="segmented-control mode-control" role="group" aria-label="Chế độ luyện tập">
          <button class="segment ${mode === 'kana-to-romaji' ? 'is-active' : ''}" data-action="set-mode" data-mode="kana-to-romaji">Kana → Romaji</button>
          <button class="segment ${mode === 'romaji-to-kana' ? 'is-active' : ''}" data-action="set-mode" data-mode="romaji-to-kana">Romaji → Kana</button>
        </div>
      </div>
      <div class="kana-workspace">
        <div class="kana-table-area">
          <div class="group-tabs" role="tablist" aria-label="Nhóm ký tự">
            ${Object.entries(groupNames).map(([key, name]) => `<button role="tab" aria-selected="${activeGroup === key}" class="group-tab ${activeGroup === key ? 'is-active' : ''}" data-action="set-group" data-group="${key}">${name}<span>${table[key].length}</span></button>`).join('')}
          </div>
          <div class="kana-grid" aria-label="Các ký tự ${escapeHtml(groupNames[activeGroup])}">
            ${entries.map((item) => `<button class="kana-tile ${focus.kana === item.kana ? 'is-selected' : ''}" data-action="select-kana" data-kana="${escapeHtml(item.kana)}" aria-pressed="${focus.kana === item.kana}"><strong lang="ja">${escapeHtml(item.kana)}</strong><span>${escapeHtml(item.romaji)}</span></button>`).join('')}
          </div>
        </div>
        <aside class="kana-focus" aria-live="polite">
          <p class="eyebrow">KÝ TỰ ĐANG HỌC</p>
          <div class="focus-character" lang="ja">${escapeHtml(focus.kana)}</div>
          <strong class="focus-romaji">${escapeHtml(focus.romaji)}</strong>
          <p class="focus-hint">${script === 'hiragana' ? 'Dùng chủ yếu cho từ gốc Nhật và phần ngữ pháp.' : 'Dùng thường xuyên cho từ mượn và tên nước ngoài.'}</p>
          <div class="focus-divider"></div>
          <div class="focus-summary"><span>${groupNames[activeGroup]}</span><strong>${entries.length} ký tự</strong></div>
          ${saved ? `<div class="last-score"><span>KẾT QUẢ TỐT NHẤT</span><strong>${saved.best}%</strong></div>` : ''}
          <button class="primary-button test-button" data-action="start-quiz">Kiểm tra nhóm này <span aria-hidden="true">→</span></button>
        </aside>
      </div>
      <div class="kana-note"><span class="note-symbol">i</span><p>Gợi ý đọc romaji là cách hỗ trợ ghi nhớ ban đầu. Ưu tiên nhận diện hình dáng và âm đọc trực tiếp của kana.</p></div>
      ${renderQuiz()}
    `;
  }

  section.addEventListener('click', (event) => {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const action = control.dataset.action;
    if (action === 'set-group') {
      activeGroup = control.dataset.group;
      selectedKana = tables[script][activeGroup][0].kana;
      quizState = null;
    } else if (action === 'set-mode') {
      mode = control.dataset.mode;
      quizState = null;
    } else if (action === 'select-kana') {
      selectedKana = control.dataset.kana;
    } else if (action === 'start-quiz' || action === 'retry-quiz') {
      quizState = {
        questions: createKanaQuiz({ script, group: activeGroup, mode, tables }),
        index: 0,
        answers: {},
        result: null,
      };
    } else if (action === 'select-answer' && quizState) {
      const question = quizState.questions[quizState.index];
      quizState.answers[question.id] = control.dataset.option;
    } else if (action === 'next-question' && quizState) {
      if (quizState.index < quizState.questions.length - 1) {
        quizState.index += 1;
      } else {
        const result = gradeQuiz(quizState.questions, quizState.answers);
        const missedIds = missedKanaIds(quizState.questions, quizState.answers);
        quizState.result = result;
        updateProgress(recordScore(currentProgress, `kana:${script}`, { percent: result.percent, missedIds }));
      }
    } else if (action === 'close-quiz' || action === 'cancel-quiz') {
      quizState = null;
    }
    render();
    const selected = section.querySelector('.kana-tile.is-selected');
    if (action === 'select-answer') section.querySelector('.quiz-option[aria-pressed="true"]')?.focus();
    else if (action === 'next-question') section.querySelector('[data-action="next-question"]')?.focus();
    else if (action === 'set-group') section.querySelector('[role="tab"][aria-selected="true"]')?.focus();
    else if (action === 'select-kana') selected?.focus();
  });

  render();
  return section;
}
