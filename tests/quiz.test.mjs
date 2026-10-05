import assert from 'node:assert/strict';
import test from 'node:test';

const quiz = await import('../src/lib/quiz.js').catch(() => ({}));

test('shuffle uses the supplied random source', () => {
  assert.equal(typeof quiz.shuffle, 'function');
  assert.deepEqual(quiz.shuffle(['a', 'b', 'c'], () => 0), ['b', 'c', 'a']);
});

test('buildChoices includes the answer once and removes duplicate distractors', () => {
  assert.equal(typeof quiz.buildChoices, 'function');
  const choices = quiz.buildChoices(
    { id: 'a', text: 'あ' },
    [{ id: 'b', text: 'い' }, { id: 'b', text: 'い' }, { id: 'c', text: 'う' }],
    3,
  );
  assert.equal(choices.length, 3);
  assert.equal(choices.filter((choice) => choice.id === 'a').length, 1);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
});

test('buildChoices retains the correct answer when there are more distractors than slots', () => {
  const choices = quiz.buildChoices({ id: 'answer', text: 'correct' }, [
    { id: 'a', text: 'one' },
    { id: 'b', text: 'two' },
    { id: 'c', text: 'three' },
    { id: 'd', text: 'four' },
  ], 3, () => 0);
  assert.equal(choices.length, 3);
  assert.ok(choices.some((choice) => choice.id === 'answer'));
});

test('gradeQuiz returns exact per-question feedback and percentage', () => {
  assert.equal(typeof quiz.gradeQuiz, 'function');
  const questions = [
    { id: 'q1', answerId: 'a', explanation: 'A đúng.' },
    { id: 'q2', answerId: 'c', explanation: 'C đúng.' },
  ];
  const result = quiz.gradeQuiz(questions, { q1: 'a', q2: 'b' });
  assert.equal(result.correct, 1);
  assert.equal(result.total, 2);
  assert.equal(result.percent, 50);
  assert.deepEqual(result.results.map((item) => item.isCorrect), [true, false]);
  assert.deepEqual(result.results.map((item) => item.correctId), ['a', 'c']);
});

test('gradeQuiz handles an empty quiz without a divide-by-zero result', () => {
  assert.equal(typeof quiz.gradeQuiz, 'function');
  assert.deepEqual(quiz.gradeQuiz([], {}), { correct: 0, total: 0, percent: 0, results: [] });
});
