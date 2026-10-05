export const PROGRESS_KEY = 'n5-learning-progress-v1';

export function emptyProgress() {
  return {
    version: 1,
    kana: {},
    lessons: {},
    scores: {},
    knownVocabulary: [],
    completedSections: [],
    lastRoute: '#/',
  };
}

export function loadProgress(storage) {
  try {
    const saved = storage.getItem(PROGRESS_KEY);
    if (!saved) return emptyProgress();
    const parsed = JSON.parse(saved);
    if (!parsed || parsed.version !== 1 || typeof parsed !== 'object') return emptyProgress();
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage) {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify({ ...emptyProgress(), ...progress }));
    return true;
  } catch {
    return false;
  }
}

export function recordScore(progress, key, score) {
  const previous = progress.scores[key] ?? { latest: 0, best: 0, missedIds: [] };
  const latest = Math.max(0, Math.min(100, Math.round(score.percent)));
  return {
    ...progress,
    scores: {
      ...progress.scores,
      [key]: {
        latest,
        best: Math.max(previous.best, latest),
        missedIds: [...new Set(score.missedIds ?? [])],
      },
    },
  };
}

export function clearProgress(storage) {
  try {
    storage.removeItem(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}
