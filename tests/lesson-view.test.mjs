import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonRoute, parseRoute } from '../src/lib/routes.js';
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
