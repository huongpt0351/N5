import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonRoute, parseRoute } from '../src/lib/routes.js';
import { getLessonStepNavigation } from '../src/lib/lesson-navigation.js';
const lessonProgress = await import('../src/lib/lesson-progress.js').catch(() => ({}));

const sections = ['vocabulary', 'grammar', 'reading', 'writing', 'quiz'];

test('all five lesson sections create valid routes at the first and last lesson', () => {
  for (const lessonId of [1, 25]) {
    for (const section of sections) {
      const route = lessonRoute(lessonId, section);
      assert.deepEqual(parseRoute(route), { name: 'lesson', lessonId, section });
    }
  }
});

test('lesson score ids stay stable and separate across lesson numbers', () => {
  assert.equal(typeof lessonProgress.lessonQuizKey, 'function');
  assert.equal(lessonProgress.lessonQuizKey(1), 'lesson:1:quiz');
  assert.equal(lessonProgress.lessonQuizKey(25), 'lesson:25:quiz');
  assert.notEqual(lessonProgress.lessonQuizKey(1), lessonProgress.lessonQuizKey(25));
});

test('lesson sections navigate forward and backward in curriculum order', () => {
  assert.deepEqual(getLessonStepNavigation(1, 'vocabulary'), { previous: null, next: { lessonId: 1, section: 'grammar', label: 'Phần tiếp theo' } });
  assert.deepEqual(getLessonStepNavigation(2, 'vocabulary'), { previous: { lessonId: 1, section: 'quiz', label: 'Phần trước đó' }, next: { lessonId: 2, section: 'grammar', label: 'Phần tiếp theo' } });
  assert.deepEqual(getLessonStepNavigation(24, 'quiz'), { previous: { lessonId: 24, section: 'writing', label: 'Phần trước đó' }, next: { lessonId: 25, section: 'vocabulary', label: 'Bài tiếp theo' } });
  assert.deepEqual(getLessonStepNavigation(25, 'quiz'), { previous: { lessonId: 25, section: 'writing', label: 'Phần trước đó' }, next: null });
});
