import { isLessonComplete, lessonQuizKey } from '../lib/lesson-progress.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function renderLessonList({ lessons, progress }) {
  const section = document.createElement('section');
  section.className = 'lesson-list-view';
  const completed = lessons.filter((lesson) => isLessonComplete(progress, lesson.id)).length;
  section.innerHTML = `
    <div class="view-intro lesson-list-intro">
      <div><p class="eyebrow">LỘ TRÌNH HỌC</p><h1>25 BÀI N5</h1><p>Từ những câu giao tiếp đầu tiên đến phần tổng ôn JLPT N5.</p></div>
      <div class="course-count"><strong>${completed}<span> / 25</span></strong><small>BÀI ĐÃ HOÀN THÀNH</small></div>
    </div>
    <div class="lesson-list-heading"><span>CHƯƠNG TRÌNH N5</span><span>${lessons.length} BÀI HỌC</span></div>
    <div class="lesson-list" aria-label="25 bài học tiếng Nhật N5">
      ${lessons.map((lesson) => {
        const complete = isLessonComplete(progress, lesson.id);
        const score = progress.scores[lessonQuizKey(lesson.id)];
        return `<a class="lesson-row ${complete ? 'is-complete' : ''}" href="#/lesson/${lesson.id}/vocabulary">
          <span class="lesson-row-number">${String(lesson.id).padStart(2, '0')}</span>
          <span class="lesson-row-copy"><strong>${escapeHtml(lesson.title)}</strong><small>${complete ? 'Đã hoàn thành bài tập tổng hợp' : 'Từ mới · Ngữ pháp · Đọc · Viết · Bài tập'}</small></span>
          <span class="lesson-row-score">${complete ? `${score?.best ?? 0}%` : 'BẮT ĐẦU'}</span>
          <span class="lesson-row-arrow" aria-hidden="true">→</span>
        </a>`;
      }).join('')}
    </div>`;
  return section;
}
