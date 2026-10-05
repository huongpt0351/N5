import assert from 'node:assert/strict';
import test from 'node:test';

const routes = await import('../src/lib/routes.js').catch(() => ({}));

test('parseRoute recognizes home, kana, lesson, and review routes', () => {
  assert.equal(typeof routes.parseRoute, 'function');
  assert.deepEqual(routes.parseRoute('#/'), { name: 'home' });
  assert.deepEqual(routes.parseRoute('#/kana/hiragana'), {
    name: 'kana',
    script: 'hiragana',
  });
  assert.deepEqual(routes.parseRoute('#/lesson/25/quiz'), {
    name: 'lesson',
    lessonId: 25,
    section: 'quiz',
  });
  assert.deepEqual(routes.parseRoute('#/review'), { name: 'review' });
  assert.deepEqual(routes.parseRoute('#/lessons'), { name: 'lesson-list' });
});

test('invalid hashes safely resolve to home', () => {
  assert.deepEqual(routes.parseRoute('#/lesson/26/quiz'), { name: 'home' });
  assert.deepEqual(routes.parseRoute('#/lesson/1/unknown'), { name: 'home' });
  assert.deepEqual(routes.parseRoute('#/kana/romaji'), { name: 'home' });
  assert.deepEqual(routes.parseRoute('#/anything'), { name: 'home' });
});

test('lessonRoute encodes valid lesson section locations', () => {
  assert.equal(typeof routes.lessonRoute, 'function');
  assert.equal(routes.lessonRoute(1, 'vocabulary'), '#/lesson/1/vocabulary');
  assert.equal(routes.lessonRoute(25, 'quiz'), '#/lesson/25/quiz');
});
