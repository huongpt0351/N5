import { parseRoute } from './lib/routes.js';
import { clearProgress, loadProgress, saveProgress } from './lib/progress.js';
import { KANA_TABLES } from './data/kana.js';
import { LESSONS } from './data/lessons.js';
import { collectReviewItems, countCompletedLessons, getNextLesson, hasKanaScore } from './lib/dashboard.js';
import { renderKanaView } from './views/kana.js';
import { renderLessonList } from './views/lesson-list.js';
import { renderLessonView } from './views/lesson.js';
import { renderReviewView } from './views/review.js';

const app = document.querySelector('#app');
const storage = (() => {
  try { return window.localStorage; } catch { return { getItem: () => null, setItem: () => {}, removeItem: () => {} }; }
})();
let progress = loadProgress(storage);

const navItems = [
  { href: '#/', label: 'Tổng quan', glyph: '⌂' },
  { href: '#/kana/hiragana', label: 'Bảng chữ cái', glyph: 'あ' },
  { href: '#/lessons', label: 'Lộ trình N5', glyph: '本' },
  { href: '#/review', label: 'Ôn tập', glyph: '↻' },
];

function activeHref(route) {
  if (route.name === 'kana') return '#/kana/hiragana';
  if (route.name === 'lesson') return '#/lesson/1/vocabulary';
  if (route.name === 'lesson-list') return '#/lessons';
  if (route.name === 'review') return '#/review';
  return '#/';
}

function dashboardMarkup() {
  const completed = countCompletedLessons(LESSONS, progress);
  const percent = Math.round((completed / LESSONS.length) * 100);
  const nextLesson = getNextLesson(LESSONS, progress);
  const nextNumber = nextLesson ? String(nextLesson.id).padStart(2, '0') : '✓';
  const reviewItems = collectReviewItems(progress, LESSONS, KANA_TABLES);
  const nextHref = nextLesson ? `#/lesson/${nextLesson.id}/vocabulary` : '#/lessons';
  const dateLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
  return `
    <section class="welcome-row" aria-labelledby="welcome-title">
      <div>
        <p class="eyebrow">${dateLabel}</p>
        <h1 id="welcome-title">Chào buổi sáng <span class="sun-mark">●</span></h1>
        <p class="welcome-copy">Một chút tiếng Nhật mỗi ngày sẽ đưa bạn đi xa hơn.</p>
      </div>
      <div class="daily-mark" aria-label="Chữ cái hôm nay: あ">
        <span>今日の文字</span>
        <strong>あ</strong>
        <small>a · âm a</small>
      </div>
    </section>

    <section class="stats-row" aria-label="Tiến độ học tập">
      <div class="stat-block"><span>TIẾN ĐỘ N5</span><strong>${percent}<small>%</small></strong></div>
      <div class="stat-block"><span>BẢNG CHỮ ĐÃ KIỂM TRA</span><strong>${Number(hasKanaScore(progress, 'hiragana')) + Number(hasKanaScore(progress, 'katakana'))}<small> / 2</small></strong></div>
      <div class="stat-block"><span>BÀI ĐÃ HOÀN THÀNH</span><strong>${completed}<small> / 25</small></strong></div>
      <a class="text-link" href="#/lessons">Xem lộ trình <span aria-hidden="true">→</span></a>
    </section>

    <section class="continue-section" aria-labelledby="continue-title">
      <div class="section-heading">
        <div><p class="eyebrow">${nextLesson ? (completed ? 'TIẾP TỤC HỌC' : 'BẮT ĐẦU HỌC') : 'HOÀN THÀNH LỘ TRÌNH'}</p><h2 id="continue-title">${nextLesson ? `Bài ${nextNumber} · ${nextLesson.title}` : 'Bạn đã hoàn thành 25 bài N5'}</h2></div>
        <span class="section-index">${nextNumber} <i>/ 25</i></span>
      </div>
      <div class="lesson-feature">
        <div class="lesson-number">${nextNumber}</div>
        <div class="lesson-summary">
          <p class="lesson-kicker">${nextLesson ? `BÀI ${nextNumber} · ${completed ? 'TIẾP THEO' : 'LÀM QUEN'}` : 'KOTOBA · N5'}</p>
          <h3>${nextLesson ? nextLesson.title : 'Chúc mừng bạn đã hoàn tất lộ trình.'}</h3>
          <p>${nextLesson ? 'Học tiếp các nội dung và hoàn thành bài tập tổng hợp của bài này.' : 'Bạn có thể xem lại các mục cần ôn hoặc luyện lại bất kỳ bài nào.'}</p>
          <div class="section-tags"><span>Từ mới</span><span>Ngữ pháp</span><span>Luyện đọc</span><span>Luyện viết</span><span>Bài tập</span></div>
        </div>
        <a class="primary-button" href="${nextHref}">${nextLesson ? 'Tiếp tục học' : 'Xem bài học'} <span aria-hidden="true">→</span></a>
      </div>
    </section>

    <section class="review-summary" aria-labelledby="review-summary-title">
      <div class="section-heading"><div><p class="eyebrow">GHI NHỚ</p><h2 id="review-summary-title">Mục cần ôn</h2></div><a class="text-link" href="#/review">Xem tất cả (${reviewItems.length}) <span aria-hidden="true">→</span></a></div>
      <p>${reviewItems.length ? `${reviewItems.length} mục từ các bài kiểm tra đã làm.` : 'Các ký tự và câu hỏi trả lời sai sẽ được lưu ở đây.'}</p>
    </section>

    <section class="kana-section" aria-labelledby="kana-title">
      <div class="section-heading">
        <div><p class="eyebrow">NỀN TẢNG</p><h2 id="kana-title">Bảng chữ cái</h2></div>
        <a class="text-link" href="#/kana/hiragana">Học ngay <span aria-hidden="true">→</span></a>
      </div>
      <div class="kana-pair">
        <a href="#/kana/hiragana" class="kana-card">
          <span class="kana-label">HIRAGANA ${hasKanaScore(progress, 'hiragana') ? '· ĐÃ KIỂM TRA' : ''}</span><strong>あ</strong><span class="kana-count">46 ký tự cơ bản <i>→</i></span>
        </a>
        <a href="#/kana/katakana" class="kana-card kana-card-alt">
          <span class="kana-label">KATAKANA ${hasKanaScore(progress, 'katakana') ? '· ĐÃ KIỂM TRA' : ''}</span><strong>ア</strong><span class="kana-count">46 ký tự cơ bản <i>→</i></span>
        </a>
      </div>
    </section>
    <div class="dashboard-tools"><button class="text-button" type="button" data-action="clear-progress">Xóa toàn bộ tiến độ</button></div>
  `;
}

function routeContent(route) {
  if (route.name === 'home') return dashboardMarkup();
  const titles = {
    kana: route.script === 'hiragana' ? 'Hiragana' : 'Katakana',
    'lesson-list': 'Lộ trình N5',
    lesson: `Bài ${String(route.lessonId).padStart(2, '0')}`,
    review: 'Ôn tập',
  };
  return `<section class="empty-view"><p class="eyebrow">KOTOBA · N5</p><h1>${titles[route.name]}</h1><p>Nội dung học đang được chuẩn bị.</p><a class="text-link" href="#/">Về tổng quan <span aria-hidden="true">→</span></a></section>`;
}

export function renderApp() {
  const route = parseRoute(location.hash);
  const selectedHref = activeHref(route);
  const routeTitle = route.name === 'home'
    ? 'Tổng quan'
    : route.name === 'kana'
      ? (route.script === 'hiragana' ? 'Hiragana' : 'Katakana')
    : route.name === 'review'
      ? 'Ôn tập'
      : route.name === 'lesson-list'
        ? 'Lộ trình N5'
        : `Bài ${String(route.lessonId).padStart(2, '0')}`;
  app.innerHTML = `
    <div class="app-frame">
      <aside class="sidebar">
        <a class="brand" href="#/" aria-label="Kotoba, trang tổng quan">
          <span class="brand-symbol">こ</span><span class="brand-name">KOTOBA<span>.</span><small>HỌC TIẾNG NHẬT N5</small></span>
        </a>
        <div class="nav-caption">KHÔNG GIAN HỌC</div>
        <nav class="main-nav" aria-label="Điều hướng chính">
          ${navItems.map((item) => `<a class="nav-link ${item.href === selectedHref ? 'is-active' : ''}" href="${item.href}" ${item.href === selectedHref ? 'aria-current="page"' : ''}><span class="nav-glyph" aria-hidden="true">${item.glyph}</span>${item.label}</a>`).join('')}
        </nav>
        <div class="sidebar-bottom"><div class="level-label">MỤC TIÊU CỦA BẠN</div><div class="level-title"><span>N5</span><span>●</span></div><div class="level-caption">Bậc sơ cấp · JLPT</div><div class="level-track"><span></span></div></div>
        <div class="profile-row"><span class="profile-avatar">学</span><span><strong>Người học</strong><small>Hành trình đầu tiên</small></span><button class="more-button" aria-label="Tùy chọn hồ sơ">···</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div class="breadcrumb">Học tập <span>/</span> <strong>${routeTitle}</strong></div><div class="topbar-right"><span class="today-label">日本語 · MỖI NGÀY MỘT CHÚT</span><button class="icon-button" aria-label="Thông báo">♧</button></div></header>
        <div class="page-content">${routeContent(route)}</div>
      </main>
    </div>
  `;
  const pageContent = app.querySelector('.page-content');
  if (route.name === 'kana') {
    pageContent.replaceChildren(renderKanaView({
      script: route.script,
      tables: KANA_TABLES,
      progress,
      onProgress: (nextProgress) => {
        progress = nextProgress;
        saveProgress(progress, storage);
      },
    }));
  }
  if (route.name === 'lesson-list') {
    pageContent.replaceChildren(renderLessonList({ lessons: LESSONS, progress }));
  }
  if (route.name === 'lesson') {
    const lesson = LESSONS.find((item) => item.id === route.lessonId);
    if (lesson) {
      pageContent.replaceChildren(renderLessonView({
        lesson,
        section: route.section,
        progress,
        onProgress: (nextProgress) => {
          progress = nextProgress;
          saveProgress(progress, storage);
        },
      }));
    }
  }
  if (route.name === 'review') {
    pageContent.replaceChildren(renderReviewView({
      items: collectReviewItems(progress, LESSONS, KANA_TABLES),
    }));
  }
  pageContent.addEventListener('click', (event) => {
    const clearButton = event.target.closest('[data-action="clear-progress"]');
    if (!clearButton) return;
    if (!window.confirm('Xóa toàn bộ tiến độ và điểm đã lưu trên thiết bị này?')) return;
    clearProgress(storage);
    progress = loadProgress(storage);
    renderApp();
  });
  if (location.hash) {
    progress = { ...progress, lastRoute: location.hash };
    saveProgress(progress, storage);
  }
}

window.addEventListener('hashchange', renderApp);
renderApp();
