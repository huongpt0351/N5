function buildRows(group, readings, kana) {
  const romaji = readings.split(' ');
  const characters = [...kana];
  if (romaji.length !== characters.length) throw new Error(`Kana row mismatch: ${group}`);
  return characters.map((character, index) => ({ kana: character, romaji: romaji[index], group }));
}

const basicReadings = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n';
const basicHiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const basicKatakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

const voicedReadings = 'ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po';
const voicedHiragana = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const voicedKatakana = 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ';

const combinedPairs = [
  ['k', 'き'], ['sh', 'し'], ['ch', 'ち'], ['n', 'に'], ['h', 'ひ'], ['m', 'み'], ['r', 'り'],
  ['g', 'ぎ'], ['j', 'じ'], ['b', 'び'], ['p', 'ぴ'],
];
const yoonSuffixes = ['ゃ', 'ゅ', 'ょ'];
const katakanaYoonSuffixes = ['ャ', 'ュ', 'ョ'];
const yoonReadings = ['ya', 'yu', 'yo'];

function buildCombined(script) {
  const suffixes = script === 'hiragana' ? yoonSuffixes : katakanaYoonSuffixes;
  return combinedPairs.flatMap(([sound, base]) => suffixes.map((suffix, index) => {
    const vowel = yoonReadings[index].slice(1);
    const romaji = ['sh', 'ch', 'j'].includes(sound) ? `${sound}${vowel}` : `${sound}${yoonReadings[index]}`;
    return {
    kana: `${script === 'hiragana' ? base : String.fromCodePoint(base.codePointAt(0) + 0x60)}${suffix}`,
    romaji,
    group: 'combined',
    };
  }));
}

export const KANA_TABLES = {
  hiragana: {
    basic: buildRows('basic', basicReadings, basicHiragana),
    voiced: buildRows('voiced', voicedReadings, voicedHiragana),
    combined: buildCombined('hiragana'),
  },
  katakana: {
    basic: buildRows('basic', basicReadings, basicKatakana),
    voiced: buildRows('voiced', voicedReadings, voicedKatakana),
    combined: buildCombined('katakana'),
  },
};
