import { buildChoices, gradeQuiz, shuffle } from './quiz.js';

export function createKanaQuiz({ script, group, mode, tables, random = Math.random }) {
  const entries = tables[script]?.[group] ?? [];
  const sample = shuffle(entries, random).slice(0, Math.min(10, entries.length));
  return sample.map((item) => {
    const isReverse = mode === 'romaji-to-kana';
    const answer = isReverse
      ? { id: item.kana, text: item.kana }
      : { id: item.kana, text: item.romaji };
    const seenTexts = new Set([answer.text]);
    const distractors = entries
      .filter((candidate) => candidate.kana !== item.kana)
      .map((candidate) => ({
        id: candidate.kana,
        text: isReverse ? candidate.kana : candidate.romaji,
      }))
      .filter((candidate) => {
        if (seenTexts.has(candidate.text)) return false;
        seenTexts.add(candidate.text);
        return true;
      });
    const options = buildChoices(answer, distractors, 4, random);
    return {
      id: `kana:${script}:${group}:${item.kana}`,
      itemId: item.kana,
      prompt: isReverse
        ? `Chọn ký tự cho âm "${item.romaji}".`
        : `Ký tự "${item.kana}" đọc là gì?`,
      options,
      answerId: answer.id,
      explanation: `${item.kana} được đọc là ${item.romaji}.`,
    };
  });
}

export function missedKanaIds(questions, answers) {
  const result = gradeQuiz(questions, answers);
  const missed = new Set(
    result.results.filter((item) => !item.isCorrect).map((item) => item.questionId),
  );
  return questions.filter((question) => missed.has(question.id)).map((question) => question.itemId);
}
