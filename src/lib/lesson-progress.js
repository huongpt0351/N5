export function lessonQuizKey(lessonId) {
  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 25) return null;
  return `lesson:${lessonId}:quiz`;
}

export function isLessonComplete(progress, lessonId) {
  return progress.lessons[lessonId]?.complete === true;
}
