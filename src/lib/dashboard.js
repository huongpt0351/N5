import { isLessonComplete } from './lesson-progress.js';
import { lessonRoute } from './routes.js';

export function getNextLesson(lessons, progress) {
  return lessons.find((lesson) => !isLessonComplete(progress, lesson.id)) ?? null;
}

export function collectReviewItems(progress, lessons, kanaTables) {
  const items = [];
  for (const [key, score] of Object.entries(progress.scores ?? {})) {
    const kanaMatch = key.match(/^kana:(hiragana|katakana)$/);
    if (kanaMatch) {
      const script = kanaMatch[1];
      const entries = Object.values(kanaTables[script] ?? {}).flat();
      for (const kana of score.missedIds ?? []) {
        const entry = entries.find((item) => item.kana === kana);
        if (!entry) continue;
        items.push({
          type: 'kana',
          label: `${entry.kana} · ${entry.romaji}`,
          detail: `${script === 'hiragana' ? 'Hiragana' : 'Katakana'} · Ôn lại cách nhận diện ký tự và âm đọc.`,
          href: `#/kana/${script}`,
        });
      }
      continue;
    }

    const lessonMatch = key.match(/^lesson:(\d+):quiz$/);
    if (!lessonMatch) continue;
    const lessonId = Number(lessonMatch[1]);
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) continue;
    for (const missedId of score.missedIds ?? []) {
      const question = lesson.quiz.find((item) => item.id === missedId);
      if (!question) continue;
      items.push({
        type: 'lesson',
        label: question.prompt,
        detail: question.explanation,
        href: lessonRoute(lessonId, 'quiz'),
      });
    }
  }
  return items;
}

export function countCompletedLessons(lessons, progress) {
  return lessons.filter((lesson) => isLessonComplete(progress, lesson.id)).length;
}

export function hasKanaScore(progress, script) {
  return Boolean(progress.scores?.[`kana:${script}`]);
}
