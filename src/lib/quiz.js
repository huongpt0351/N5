export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildChoices(answer, distractors, count = 4, random = Math.random) {
  const unique = new Map([[answer.id, answer]]);
  for (const item of distractors) {
    if (!unique.has(item.id)) unique.set(item.id, item);
  }
  const candidates = [...unique.values()].filter((item) => item.id !== answer.id);
  const selected = shuffle(candidates, random).slice(0, Math.max(0, count - 1));
  return shuffle([...selected, answer], random);
}

export function gradeQuiz(questions, answers) {
  const results = questions.map((question) => {
    const selectedId = answers[question.id] ?? null;
    return {
      questionId: question.id,
      selectedId,
      correctId: question.answerId,
      isCorrect: selectedId === question.answerId,
      explanation: question.explanation,
    };
  });
  const correct = results.filter((result) => result.isCorrect).length;
  const total = results.length;
  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    results,
  };
}
