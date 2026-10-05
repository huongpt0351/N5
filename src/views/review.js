function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function renderReviewView({ items, onOpenItem }) {
  const section = document.createElement('section');
  section.className = 'review-view';
  section.innerHTML = `
    <div class="view-intro lesson-list-intro">
      <div><p class="eyebrow">ÔN TẬP CÁ NHÂN</p><h1>NHỮNG MỤC CẦN ÔN</h1><p>Các ký tự và câu hỏi bạn muốn luyện lại.</p></div>
      <div class="course-count"><strong>${items.length}</strong><small>MỤC CẦN ÔN</small></div>
    </div>
    ${items.length ? `<div class="review-list">${items.map((item, index) => `
      <article class="review-row">
        <span class="review-index">${String(index + 1).padStart(2, '0')}</span>
        <div class="review-copy"><span class="review-type">${item.type === 'kana' ? 'BẢNG CHỮ CÁI' : 'BÀI TẬP N5'}</span><h2>${escapeHtml(item.label)}</h2><p>${escapeHtml(item.detail)}</p></div>
        <a class="text-link" href="${escapeHtml(item.href)}" data-review-link>Ôn mục này <span aria-hidden="true">→</span></a>
      </article>`).join('')}</div>` : `<div class="review-empty"><p class="eyebrow">CHƯA CÓ MỤC NÀO</p><h2>BẠN ĐANG THEO KỊP</h2><p>Sau khi làm bài kiểm tra, các mục cần ôn sẽ xuất hiện ở đây.</p><a class="primary-button" href="#/lessons">Mở lộ trình <span aria-hidden="true">→</span></a></div>`}
  `;
  section.addEventListener('click', (event) => {
    const link = event.target.closest('[data-review-link]');
    if (link) onOpenItem?.(link.getAttribute('href'));
  });
  return section;
}
