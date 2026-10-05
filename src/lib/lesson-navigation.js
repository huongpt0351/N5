const sections = ['vocabulary', 'grammar', 'reading', 'writing', 'quiz'];

export function getLessonStepNavigation(lessonId, section) {
  const sectionIndex = sections.indexOf(section);
  if (lessonId < 1 || lessonId > 25 || sectionIndex < 0) {
    return { previous: null, next: null };
  }

  const stepIndex = (lessonId - 1) * sections.length + sectionIndex;
  const lastStep = 25 * sections.length - 1;
  const previous = stepIndex > 0 ? stepAt(stepIndex - 1, 'previous') : null;
  const next = stepIndex < lastStep ? stepAt(stepIndex + 1, 'next') : null;
  return { previous, next };
}

function stepAt(stepIndex, direction) {
  const lessonId = Math.floor(stepIndex / sections.length) + 1;
  const section = sections[stepIndex % sections.length];
  const isNextLesson = direction === 'next' && section === 'vocabulary';
  return {
    lessonId,
    section,
    label: isNextLesson ? 'Bài tiếp theo' : direction === 'next' ? 'Phần tiếp theo' : 'Phần trước đó',
  };
}
