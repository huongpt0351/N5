import assert from 'node:assert/strict';
import test from 'node:test';
import { KANA_TABLES } from '../src/data/kana.js';

const practice = await import('../src/lib/kana-practice.js').catch(() => ({}));

test('kana quizzes contain a balanced sample only from the selected script and group', () => {
  assert.equal(typeof practice.createKanaQuiz, 'function');
  const questions = practice.createKanaQuiz({
    script: 'hiragana', group: 'basic', mode: 'kana-to-romaji', tables: KANA_TABLES, random: () => 0,
  });
  assert.equal(questions.length, 10);
  assert.ok(questions.every((question) => question.id.startsWith('kana:hiragana:basic:')));
  assert.ok(questions.every((question) => question.options.length === 4));
  assert.ok(questions.every((question) => question.options.some((option) => option.id === question.answerId)));
});

test('reverse practice presents romaji and uses kana as the answer', () => {
  const questions = practice.createKanaQuiz({
    script: 'katakana', group: 'basic', mode: 'romaji-to-kana', tables: KANA_TABLES, random: () => 0,
  });
  assert.ok(questions.every((question) => question.prompt.startsWith('Chọn ký tự cho âm')));
  assert.ok(questions.every((question) => question.options.find((option) => option.id === question.answerId)?.text));
});

test('missedKanaIds returns stable character ids for review', () => {
  assert.equal(typeof practice.missedKanaIds, 'function');
  const questions = practice.createKanaQuiz({
    script: 'hiragana', group: 'basic', mode: 'kana-to-romaji', tables: KANA_TABLES, random: () => 0,
  });
  const first = questions[0];
  const wrongOption = first.options.find((option) => option.id !== first.answerId);
  assert.deepEqual(practice.missedKanaIds([first], { [first.id]: wrongOption.id }), [first.itemId]);
});
