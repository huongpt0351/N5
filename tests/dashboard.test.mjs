import assert from 'node:assert/strict';
import test from 'node:test';
import { KANA_TABLES } from '../src/data/kana.js';
import { LESSONS } from '../src/data/lessons.js';

const dashboard = await import('../src/lib/dashboard.js').catch(() => ({}));

const empty = {
  version: 1,
  kana: {},
  lessons: {},
  scores: {},
  knownVocabulary: [],
  completedSections: [],
  lastRoute: '#/',
};

test('empty progress recommends the first lesson', () => {
  assert.equal(typeof dashboard.getNextLesson, 'function');
  assert.equal(dashboard.getNextLesson(LESSONS, empty).id, 1);
});

test('completed lessons are skipped and finished courses return null', () => {
  const partial = { ...empty, lessons: { 1: { complete: true } } };
  assert.equal(dashboard.getNextLesson(LESSONS, partial).id, 2);
  const complete = { ...empty, lessons: Object.fromEntries(LESSONS.map((lesson) => [lesson.id, { complete: true }])) };
  assert.equal(dashboard.getNextLesson(LESSONS, complete), null);
});

test('review items resolve missed kana and lesson questions to their source routes', () => {
  assert.equal(typeof dashboard.collectReviewItems, 'function');
  const progress = {
    ...empty,
    scores: {
      'kana:hiragana': { latest: 50, best: 80, missedIds: ['あ'] },
      'lesson:1:quiz': { latest: 60, best: 80, missedIds: ['l1-quiz-v1'] },
    },
  };
  const items = dashboard.collectReviewItems(progress, LESSONS, KANA_TABLES);
  assert.equal(items.length, 2);
  assert.ok(items.some((item) => item.type === 'kana' && item.label.includes('あ') && item.href === '#/kana/hiragana'));
  assert.ok(items.some((item) => item.type === 'lesson' && item.href === '#/lesson/1/quiz' && item.detail.includes('nghĩa là')));
});
