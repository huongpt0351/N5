const LESSON_SECTIONS = new Set([
  'vocabulary',
  'grammar',
  'reading',
  'writing',
  'quiz',
]);

export function parseRoute(hash = '#/') {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'home' };
  if (path === '/lessons') return { name: 'lesson-list' };
  if (path === '/review') return { name: 'review' };

  const kanaMatch = path.match(/^\/kana\/(hiragana|katakana)$/);
  if (kanaMatch) return { name: 'kana', script: kanaMatch[1] };

  const lessonMatch = path.match(/^\/lesson\/(\d+)\/([a-z-]+)$/);
  if (lessonMatch) {
    const lessonId = Number(lessonMatch[1]);
    const section = lessonMatch[2];
    if (lessonId >= 1 && lessonId <= 25 && LESSON_SECTIONS.has(section)) {
      return { name: 'lesson', lessonId, section };
    }
  }

  return { name: 'home' };
}

export function lessonRoute(lessonId, section) {
  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 25) return '#/';
  if (!LESSON_SECTIONS.has(section)) return '#/';
  return `#/lesson/${lessonId}/${section}`;
}
