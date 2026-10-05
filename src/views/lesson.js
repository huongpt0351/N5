import { lessonRoute } from '../lib/routes.js';
import { lessonQuizKey } from '../lib/lesson-progress.js';
import { gradeQuiz } from '../lib/quiz.js';
import { recordScore } from '../lib/progress.js';
import { getLessonStepNavigation } from '../lib/lesson-navigation.js';

const sections = [
  ['vocabulary', 'Từ mới'],
  ['grammar', 'Ngữ pháp'],
  ['reading', 'Luyện đọc'],
  ['writing', 'Luyện viết'],
  ['quiz', 'Bài tập tổng hợp'],
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function sectionKey(lessonId, section) {
  return `${lessonId}:${section}`;
}

function questionMarkup(question, selectedId) {
  return `<div class="question-block"><p class="question-text">${escapeHtml(question.prompt)}</p><div class="answer-options" role="group" aria-label="Chọn đáp án">
    ${question.options.map((option, index) => `<button class="answer-option ${selectedId === option.id ? 'is-selected' : ''}" data-action="choose" data-scope="${escapeHtml(question.id)}" data-option="${escapeHtml(option.id)}" aria-pressed="${selectedId === option.id}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option.text)}</button>`).join('')}
  </div></div>`;
}

export function renderLessonView({ lesson, section: activeSection, progress, onProgress }) {
  const element = document.createElement('section');
  element.className = 'lesson-view';
  let currentProgress = progress;
  let grammarAnswers = {};
  let grammarResult = null;
  let readingAnswers = {};
  let readingResult = null;
  let writingText = '';
  let showSample = false;
  let quizState = null;

  function save(next) {
    currentProgress = next;
    onProgress(next);
  }

  function markSectionComplete(sectionId) {
    const key = sectionKey(lesson.id, sectionId);
    const completedSections = new Set(currentProgress.completedSections);
    completedSections.add(key);
    save({ ...currentProgress, completedSections: [...completedSections] });
  }

  function sectionDone(sectionId) {
    return currentProgress.completedSections.includes(sectionKey(lesson.id, sectionId));
  }

  function grammarQuestions() {
    return lesson.quiz.filter((question) => question.id.endsWith('-g1') || question.id.endsWith('-g2'));
  }

  function renderSection() {
    if (activeSection === 'vocabulary') {
      const known = new Set(currentProgress.knownVocabulary);
      return `<div class="lesson-section-heading"><div><p class="eyebrow">TỪ VỰNG TRỌNG TÂM</p><h2>Từ mới</h2></div><span>${lesson.vocabulary.length} TỪ</span></div>
        <div class="vocabulary-list">${lesson.vocabulary.map((item, index) => {
          const id = `${lesson.id}:${item.kana}`;
          return `<article class="vocabulary-row ${known.has(id) ? 'is-known' : ''}"><span class="vocabulary-index">${String(index + 1).padStart(2, '0')}</span><div class="vocabulary-main"><strong lang="ja">${escapeHtml(item.jp)}</strong><span class="vocabulary-kana" lang="ja">${escapeHtml(item.kana)}</span><p>${escapeHtml(item.vi)}</p><div class="vocabulary-examples">${item.examples.map((example, exampleIndex) => `<p><span lang="ja">${exampleIndex + 1}. ${escapeHtml(example.jp)}</span><small lang="ja">${escapeHtml(example.kana)}</small><i>${escapeHtml(example.vi)}</i></p>`).join('')}</div></div><button class="known-button" data-action="toggle-word" data-word="${escapeHtml(id)}" aria-pressed="${known.has(id)}">${known.has(id) ? 'Đã nhớ ✓' : 'Đánh dấu đã nhớ'}</button></article>`;
        }).join('')}</div>
        <div class="section-complete-row"><span>${sectionDone('vocabulary') ? 'Bạn đã hoàn thành phần từ mới.' : 'Đánh dấu các từ bạn đã nhớ để ôn lại sau.'}</span><button class="secondary-button" data-action="complete-section" data-section="vocabulary">${sectionDone('vocabulary') ? 'Đã hoàn thành' : 'Hoàn thành phần này'}</button></div>`;
    }
    if (activeSection === 'grammar') {
      const questions = grammarQuestions();
      return `<div class="lesson-section-heading"><div><p class="eyebrow">CẤU TRÚC CÂU</p><h2>Ngữ pháp</h2></div><span>${lesson.grammar.length} MẪU</span></div>
        <div class="grammar-list">${lesson.grammar.map((item, index) => `<article class="grammar-row"><span class="grammar-index">0${index + 1}</span><div><h3 class="grammar-pattern">${escapeHtml(item.pattern)}</h3><p>${escapeHtml(item.explanation)}</p>${item.examples.map((example) => `<blockquote lang="ja">${escapeHtml(example.jp)}<span>${escapeHtml(example.kana)}</span><small>${escapeHtml(example.vi)}</small></blockquote>`).join('')}</div></article>`).join('')}</div>
        <div class="practice-check"><div class="lesson-section-heading"><div><p class="eyebrow">THỬ NHANH</p><h2>Hiểu nghĩa câu mẫu</h2></div></div>${questions.map((question) => questionMarkup(question, grammarAnswers[question.id])).join('')}
          ${grammarResult ? `<div class="inline-feedback" role="status">${grammarResult.correct} / ${grammarResult.total} câu đúng. ${grammarResult.results.map((result) => result.explanation).join(' ')}</div>` : ''}
          <button class="primary-button" data-action="check-grammar">Kiểm tra đáp án <span aria-hidden="true">→</span></button>
        </div>`;
    }
    if (activeSection === 'reading') {
      return `<div class="lesson-section-heading"><div><p class="eyebrow">ĐỌC HIỂU</p><h2>Luyện đọc</h2></div><span>${lesson.reading.questions.length} CÂU HỎI</span></div>
        <article class="reading-passage"><p class="passage-label">${escapeHtml(lesson.title)}</p><p class="passage-japanese" lang="ja">${escapeHtml(lesson.reading.jp)}</p><p class="passage-kana" lang="ja">${escapeHtml(lesson.reading.kana)}</p><button class="text-toggle" data-action="toggle-translation">${showSample ? 'Ẩn bản dịch' : 'Xem bản dịch'}</button>${showSample ? `<p class="passage-translation">${escapeHtml(lesson.reading.vi)}</p>` : ''}</article>
        <div class="reading-questions">${lesson.reading.questions.map((question) => questionMarkup(question, readingAnswers[question.id])).join('')}</div>
        ${readingResult ? `<div class="inline-feedback" role="status">${readingResult.correct} / ${readingResult.total} câu đúng. ${readingResult.results.map((result) => result.explanation).join(' ')}</div>` : ''}
        <div class="section-complete-row"><span>${sectionDone('reading') ? 'Đã lưu phần luyện đọc.' : 'Trả lời câu hỏi để kiểm tra mức độ hiểu bài.'}</span><button class="primary-button" data-action="check-reading">Kiểm tra bài đọc <span aria-hidden="true">→</span></button></div>`;
    }
    if (activeSection === 'writing') {
      return `<div class="lesson-section-heading"><div><p class="eyebrow">THỰC HÀNH VIẾT</p><h2>Luyện viết</h2></div><span>VIẾT THEO GỢI Ý</span></div>
        <article class="writing-prompt"><p class="eyebrow">ĐỀ BÀI</p><h3>${escapeHtml(lesson.writing.prompt)}</h3><div class="writing-hints">${lesson.writing.hints.map((hint) => `<span lang="ja">${escapeHtml(hint)}</span>`).join('')}</div>
          <label class="writing-label" for="writing-answer">Bài viết của bạn</label><textarea id="writing-answer" rows="4" placeholder="Nhập câu trả lời bằng tiếng Nhật...">${escapeHtml(writingText)}</textarea>
          <button class="text-toggle" data-action="toggle-sample">${showSample ? 'Ẩn bài tham khảo' : 'Xem bài tham khảo'}</button>${showSample ? `<p class="writing-sample" lang="ja">${escapeHtml(lesson.writing.sample)}</p>` : ''}
        </article><div class="section-complete-row"><span>${sectionDone('writing') ? 'Đã đánh dấu hoàn thành.' : 'Phần viết tự do không được chấm tự động.'}</span><button class="secondary-button" data-action="complete-section" data-section="writing">${sectionDone('writing') ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button></div>`;
    }
    return renderComprehensiveQuiz();
  }

  function renderComprehensiveQuiz() {
    if (quizState?.result) {
      return `<div class="quiz-result lesson-result" role="status"><p class="eyebrow">BÀI TẬP TỔNG HỢP</p><h2>${quizState.result.correct} / ${quizState.result.total} CÂU ĐÚNG</h2><div class="score-line"><span>Điểm lần này</span><strong>${quizState.result.percent}%</strong></div><p>${quizState.result.percent >= 80 ? 'Bạn đã nắm khá chắc nội dung bài này.' : 'Hãy xem lại các phần sai rồi thử lại nhé.'}</p><div class="answer-review">${quizState.result.results.map((result, index) => {
        const question = lesson.quiz[index];
        const right = question.options.find((option) => option.id === result.correctId)?.text;
        return `<div class="answer-review-row ${result.isCorrect ? 'is-correct' : 'is-wrong'}"><strong>${result.isCorrect ? 'Đúng' : 'Ôn lại'} · Câu ${index + 1}</strong><p>${escapeHtml(result.explanation)}</p>${result.isCorrect ? '' : `<small>Đáp án: ${escapeHtml(right)}</small>`}</div>`;
      }).join('')}</div><div class="quiz-actions"><button class="secondary-button" data-action="retry-quiz">Làm lại bài</button><a class="primary-button" href="#/lessons">Về lộ trình <span aria-hidden="true">→</span></a></div></div>`;
    }
    const questions = lesson.quiz;
    if (!quizState) quizState = { index: 0, answers: {}, result: null };
    const question = questions[quizState.index];
    return `<div class="lesson-section-heading"><div><p class="eyebrow">KIỂM TRA KIẾN THỨC</p><h2>Bài tập tổng hợp</h2></div><span>${questions.length} CÂU HỎI</span></div>
      <div class="quiz-panel lesson-quiz-panel"><div class="quiz-progress"><span>CÂU ${quizState.index + 1} / ${questions.length}</span><span class="quiz-track"><i style="width:${((quizState.index + 1) / questions.length) * 100}%"></i></span></div>
        ${questionMarkup(question, quizState.answers[question.id])}
        <div class="quiz-actions">${quizState.index > 0 ? '<button class="secondary-button" data-action="previous-question">Câu trước</button>' : '<span></span>'}<button class="primary-button" data-action="next-lesson-question" ${quizState.answers[question.id] ? '' : 'disabled'}>${quizState.index === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo'} <span aria-hidden="true">→</span></button></div>
      </div>`;
  }

  function render() {
    const done = new Set(currentProgress.completedSections);
    element.innerHTML = `
      <div class="lesson-breadcrumb"><a href="#/lessons">LỘ TRÌNH N5</a><span>/</span><span>BÀI ${String(lesson.id).padStart(2, '0')}</span></div>
      <div class="lesson-title-row"><div><p class="eyebrow">BÀI ${String(lesson.id).padStart(2, '0')} · ${escapeHtml(lesson.title)}</p><h1 lang="ja">${escapeHtml(lesson.titleJa)}</h1><p class="lesson-title-reading" lang="ja">${escapeHtml(lesson.titleKana)}</p></div></div>
      <nav class="lesson-section-nav" aria-label="Các phần trong bài">${sections.map(([id, label]) => `<a href="${lessonRoute(lesson.id, id)}" class="lesson-section-link ${activeSection === id ? 'is-active' : ''}" ${activeSection === id ? 'aria-current="page"' : ''}><span class="section-status">${done.has(sectionKey(lesson.id, id)) ? '✓' : String(sections.findIndex(([key]) => key === id) + 1).padStart(2, '0')}</span>${label}</a>`).join('')}</nav>
      <div class="lesson-section-content">${renderSection()}</div>
      ${renderStepper()}
    `;
  }

  function renderStepper() {
    const { previous, next } = getLessonStepNavigation(lesson.id, activeSection);
    const link = (step, direction) => step
      ? `<a class="lesson-step-${direction}" href="${lessonRoute(step.lessonId, step.section)}">${direction === 'previous' ? '← ' : ''}${step.label}${direction === 'next' ? ' →' : ''}</a>`
      : '<span></span>';
    return `<div class="lesson-stepper">${link(previous, 'previous')}<span>BÀI ${String(lesson.id).padStart(2, '0')} / 25</span>${link(next, 'next')}</div>`;
  }

  element.addEventListener('input', (event) => {
    if (event.target.id === 'writing-answer') writingText = event.target.value;
  });

  element.addEventListener('click', (event) => {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const { action } = control.dataset;
    if (action === 'toggle-word') {
      const words = new Set(currentProgress.knownVocabulary);
      if (words.has(control.dataset.word)) words.delete(control.dataset.word);
      else words.add(control.dataset.word);
      save({ ...currentProgress, knownVocabulary: [...words] });
    } else if (action === 'complete-section') {
      markSectionComplete(control.dataset.section);
    } else if (action === 'choose') {
      const scope = control.dataset.scope;
      if (scope.startsWith('l')) {
        if (activeSection === 'grammar') grammarAnswers[scope] = control.dataset.option;
        if (activeSection === 'reading') readingAnswers[scope] = control.dataset.option;
        if (activeSection === 'quiz' && quizState) quizState.answers[scope] = control.dataset.option;
      }
    } else if (action === 'check-grammar') {
      grammarResult = gradeQuiz(grammarQuestions(), grammarAnswers);
      markSectionComplete('grammar');
    } else if (action === 'check-reading') {
      readingResult = gradeQuiz(lesson.reading.questions, readingAnswers);
      markSectionComplete('reading');
    } else if (action === 'toggle-translation') {
      showSample = !showSample;
    } else if (action === 'toggle-sample') {
      showSample = !showSample;
    } else if (action === 'next-lesson-question' && quizState) {
      if (quizState.index < lesson.quiz.length - 1) {
        quizState.index += 1;
      } else {
        const result = gradeQuiz(lesson.quiz, quizState.answers);
        const missedIds = result.results.filter((item) => !item.isCorrect).map((item) => item.questionId);
        quizState.result = result;
        let next = recordScore(currentProgress, lessonQuizKey(lesson.id), { percent: result.percent, missedIds });
        next = { ...next, lessons: { ...next.lessons, [lesson.id]: { complete: true } } };
        const completedSections = new Set(next.completedSections);
        completedSections.add(sectionKey(lesson.id, 'quiz'));
        next.completedSections = [...completedSections];
        save(next);
      }
    } else if (action === 'previous-question' && quizState && quizState.index > 0) {
      quizState.index -= 1;
    } else if (action === 'retry-quiz') {
      quizState = { index: 0, answers: {}, result: null };
    }
    render();
  });

  render();
  return element;
}
