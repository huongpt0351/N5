import assert from 'node:assert/strict';
import test from 'node:test';

const progressApi = await import('../src/lib/progress.js').catch(() => ({}));
const emptyProgress = {
  version: 1,
  kana: {},
  lessons: {},
  scores: {},
  knownVocabulary: [],
  completedSections: [],
  lastRoute: '#/',
};

function memoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem(key) { return entries.get(key) ?? null; },
    setItem(key, value) { entries.set(key, value); },
    removeItem(key) { entries.delete(key); },
  };
}

test('loadProgress returns an empty shape for a first-time learner', () => {
  assert.equal(typeof progressApi.loadProgress, 'function');
  assert.deepEqual(progressApi.loadProgress(memoryStorage()), emptyProgress);
});

test('saveProgress and loadProgress round-trip the complete learner state', () => {
  assert.equal(typeof progressApi.saveProgress, 'function');
  const storage = memoryStorage();
  const state = { ...emptyProgress, lastRoute: '#/lesson/3/grammar', knownVocabulary: ['gakkou'] };
  progressApi.saveProgress(state, storage);
  assert.deepEqual(progressApi.loadProgress(storage), state);
});

test('recordScore updates latest and best without mutating its input', () => {
  assert.equal(typeof progressApi.recordScore, 'function');
  const initial = { ...emptyProgress, scores: { 'kana:hiragana': { latest: 40, best: 80, missedIds: ['a'] } } };
  const next = progressApi.recordScore(initial, 'kana:hiragana', { percent: 60, missedIds: ['i'] });
  assert.equal(next.scores['kana:hiragana'].latest, 60);
  assert.equal(next.scores['kana:hiragana'].best, 80);
  assert.deepEqual(next.scores['kana:hiragana'].missedIds, ['i']);
  assert.equal(initial.scores['kana:hiragana'].latest, 40);
});

test('malformed JSON and unavailable storage recover to empty progress', () => {
  assert.equal(typeof progressApi.loadProgress, 'function');
  const invalid = memoryStorage({ 'n5-learning-progress-v1': '{' });
  assert.deepEqual(progressApi.loadProgress(invalid), emptyProgress);
  const throwingStorage = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(progressApi.loadProgress(throwingStorage), emptyProgress);
});

test('clearProgress removes saved learner state', () => {
  assert.equal(typeof progressApi.clearProgress, 'function');
  const storage = memoryStorage();
  progressApi.saveProgress({ ...emptyProgress, lastRoute: '#/review' }, storage);
  progressApi.clearProgress(storage);
  assert.deepEqual(progressApi.loadProgress(storage), emptyProgress);
});
