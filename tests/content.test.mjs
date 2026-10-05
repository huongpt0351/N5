import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [lessonModule, kanaModule] = await Promise.all([
  import('../src/data/lessons.js').catch(() => ({})),
  import('../src/data/kana.js').catch(() => ({})),
]);
const lessons = lessonModule.LESSONS ?? [];
const kanaTables = kanaModule.KANA_TABLES ?? {};

test('static entrypoint uses relative asset URLs for GitHub Pages subpaths', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\.\/src\/styles\.css"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
});

test('curriculum contains exactly 25 uniquely numbered lessons', () => {
  assert.equal(lessons.length, 25);
  assert.deepEqual(lessons.map((lesson) => lesson.id), Array.from({ length: 25 }, (_, index) => index + 1));
});

test('each lesson meets the minimum learning content and has answer keys', () => {
  assert.equal(lessons.length, 25);
  for (const lesson of lessons) {
    assert.ok(lesson.title, `lesson ${lesson.id} needs a title`);
    assert.ok(lesson.titleJa && lesson.titleKana, `lesson ${lesson.id} needs Japanese title and reading`);
    assert.equal(lesson.vocabulary.length, 15, `lesson ${lesson.id} needs 15 vocabulary items`);
    assert.equal(new Set(lesson.vocabulary.map((item) => item.jp)).size, 15, `lesson ${lesson.id} must not repeat vocabulary`);
    assert.ok(lesson.vocabulary.every((item) => item.jp && item.kana && item.vi && item.examples.length === 2));
    assert.ok(lesson.vocabulary.every((item) => item.examples.every((example) => example.jp && example.kana && example.vi)));
    assert.ok(lesson.grammar.length >= 2, `lesson ${lesson.id} needs 2 grammar points`);
    assert.ok(lesson.grammar.every((item) => item.pattern && item.explanation && item.examples.length));
    assert.ok(lesson.reading.jp && lesson.reading.kana && lesson.reading.vi);
    assert.ok(lesson.reading.questions.length >= 2, `lesson ${lesson.id} needs 2 reading questions`);
    assert.ok(lesson.writing.prompt && lesson.writing.hints.length && lesson.writing.sample);
    assert.ok(lesson.quiz.length >= 5, `lesson ${lesson.id} needs 5 comprehensive questions`);
    assert.ok(lesson.quiz.every((question) => question.id && question.prompt && question.options.length >= 2 && question.answerId && question.explanation));
    assert.ok(lesson.quiz.every((question) => question.options.some((option) => option.id === question.answerId)));
  }
});

test('comprehensive exercises do not repeat generic grammar recall questions', () => {
  for (const lesson of lessons) {
    const grammarQuestions = lesson.quiz.filter((question) => question.id.endsWith('-g1') || question.id.endsWith('-g2'));
    assert.equal(grammarQuestions.length, 2, `lesson ${lesson.id} should keep two grammar applications`);
    assert.deepEqual(grammarQuestions.map((question) => question.prompt), lesson.grammar.map((point) => (
      `Câu mẫu “${point.examples[0].jp}” có nghĩa là gì?`
    )));
    assert.ok(lesson.quiz.every((question) => !question.prompt.startsWith('Mẫu nào được học trong bài')));
    assert.ok(lesson.quiz.every((question) => !question.prompt.startsWith('Mẫu ngữ pháp thứ hai của bài')));
  }
});

test('kana tables include unique basic, voiced, and combined rows for both scripts', () => {
  assert.deepEqual(Object.keys(kanaTables).sort(), ['hiragana', 'katakana']);
  for (const script of ['hiragana', 'katakana']) {
    const table = kanaTables[script];
    for (const group of ['basic', 'voiced', 'combined']) {
      assert.ok(Array.isArray(table[group]) && table[group].length > 0, `${script}.${group} must have kana`);
      assert.ok(table[group].every((item) => item.kana && item.romaji && item.group === group));
    }
    const allKana = Object.values(table).flat().map((item) => item.kana);
    assert.equal(new Set(allKana).size, allKana.length, `${script} must not duplicate kana`);
  }
});

test('common contracted sounds use standard romaji spellings', () => {
  const hiragana = kanaTables.hiragana.combined;
  const readings = new Map(hiragana.map((item) => [item.kana, item.romaji]));
  assert.equal(readings.get('きゃ'), 'kya');
  assert.equal(readings.get('しゃ'), 'sha');
  assert.equal(readings.get('ちゃ'), 'cha');
  assert.equal(readings.get('じゃ'), 'ja');
});
