function makeOptions(values, prefix) {
  return values.map((text, index) => ({ id: `${prefix}-${index + 1}`, text }));
}

function makeReadQuestion(id, [prompt, choices, correctIndex, explanation]) {
  const options = makeOptions(choices, `${id}-choice`);
  return { id, prompt, options, answerId: options[correctIndex].id, explanation };
}

function makeGrammarMeaningQuestion(id, example, distractors) {
  const alternatives = [...new Set(distractors)].filter((meaning) => meaning !== example.vi);
  const options = makeOptions([example.vi, ...alternatives].slice(0, 4), `${id}-choice`);
  return {
    id,
    prompt: `Câu mẫu “${example.jp}” có nghĩa là gì?`,
    options,
    answerId: options[0].id,
    explanation: `${example.jp} (${example.kana}) nghĩa là ${example.vi}.`,
  };
}

const verbMeanings = new Set([
  'bơi', 'bắt đầu', 'báo cho biết', 'chơi', 'du lịch', 'dọn dẹp', 'giúp đỡ', 'giặt giũ', 'gặp', 'kết thúc', 'lái xe', 'lên xe', 'luyện tập', 'làm việc', 'mang theo', 'mua', 'mua sắm', 'nấu ăn',
  'nghỉ ngơi', 'ngủ', 'quên', 'tiếp tục', 'thức dậy', 'trở về', 'uống', 'xuống xe', 'đi', 'đi dạo', 'đọc sách', 'ăn',
  'sự chuẩn bị', 'sự tập trung', 'việc học', 'đến muộn',
]);

const ichidanReadings = new Set(['おきる', 'おりる', 'しらせる', 'たべる', 'つづける', 'ねる', 'はじめる', 'みる', 'わすれる', 'おくれる']);
const suruReadings = new Set(['うんてん', 'かいもの', 'さんぽ', 'しゅうちゅう', 'そうじ', 'せんたく', 'たんとう', 'べんきょう', 'どくしょ', 'りょうり', 'りょこう', 'れんしゅう', 'じゅんび']);

const specialExamples = {
  'いそがしい': [
    ['わたしは いそがしいです。', 'Tôi bận rộn.'],
    ['きょうは とても いそがしいです。', 'Hôm nay tôi rất bận.'],
  ],
  'じょうず': [
    ['わたしは うたが じょうずです。', 'Tôi hát hay.'],
    ['ともだちは りょうりが じょうずです。', 'Bạn tôi nấu ăn giỏi.'],
  ],
  'へた': [
    ['わたしは うたが へたです。', 'Tôi hát không giỏi.'],
    ['ともだちは りょうりが へたです。', 'Bạn tôi nấu ăn không giỏi.'],
  ],
  'ほしい': [
    ['あたらしい ほんが ほしいです。', 'Tôi muốn có quyển sách mới.'],
    ['わたしは あたらしい かばんが ほしいです。', 'Tôi muốn có chiếc cặp mới.'],
  ],
  'すき': [
    ['わたしは えいがが すきです。', 'Tôi thích phim.'],
    ['ともだちは おんがくが すきです。', 'Bạn tôi thích âm nhạc.'],
  ],
  'たかい': [
    ['この くつは たかいです。', 'Đôi giày này đắt.'],
    ['あの かばんも たかいです。', 'Chiếc cặp kia cũng đắt.'],
  ],
  'やすい': [
    ['この くつは やすいです。', 'Đôi giày này rẻ.'],
    ['あの かばんも やすいです。', 'Chiếc cặp kia cũng rẻ.'],
  ],
  'あたたかい': [
    ['きょうは あたたかいです。', 'Hôm nay trời ấm.'],
    ['この おちゃは あたたかいです。', 'Trà này còn ấm.'],
  ],
  'すずしい': [
    ['きょうは すずしいです。', 'Hôm nay trời mát.'],
    ['この へやは すずしいです。', 'Căn phòng này mát.'],
  ],
  'ふるい': [
    ['この ほんは ふるいです。', 'Quyển sách này cũ.'],
    ['あの いえも ふるいです。', 'Ngôi nhà kia cũng cũ.'],
  ],
  'あたらしい': [
    ['この ほんは あたらしいです。', 'Quyển sách này mới.'],
    ['あの かばんも あたらしいです。', 'Chiếc cặp kia cũng mới.'],
  ],
  'おおきい': [
    ['この いえは おおきいです。', 'Ngôi nhà này lớn.'],
    ['あの へやも おおきいです。', 'Căn phòng kia cũng lớn.'],
  ],
  'ちいさい': [
    ['この いえは ちいさいです。', 'Ngôi nhà này nhỏ.'],
    ['あの へやも ちいさいです。', 'Căn phòng kia cũng nhỏ.'],
  ],
  'いたい': [
    ['あたまが いたいです。', 'Tôi bị đau đầu.'],
    ['おなかも いたいです。', 'Tôi cũng bị đau bụng.'],
  ],
  'べんり': [
    ['この でんしゃは べんりです。', 'Tàu điện này tiện lợi.'],
    ['ちかてつも べんりです。', 'Tàu điện ngầm cũng tiện lợi.'],
  ],
  'ひつよう': [
    ['みずが ひつようです。', 'Tôi cần nước.'],
    ['この じしょも ひつようです。', 'Tôi cũng cần quyển từ điển này.'],
  ],
  'おなじ': [
    ['この ふたつは おなじです。', 'Hai cái này giống nhau.'],
    ['わたしたちの かばんは おなじです。', 'Cặp của chúng tôi giống nhau.'],
  ],
};

function masuForm(reading) {
  if (suruReadings.has(reading)) return `${reading}します`;
  if (reading === 'いく') return 'いきます';
  if (ichidanReadings.has(reading)) return `${reading.slice(0, -1)}ます`;
  const forms = { う: 'います', く: 'きます', ぐ: 'ぎます', す: 'します', つ: 'ちます', ぬ: 'にます', ぶ: 'びます', む: 'みます', る: 'ります' };
  const ending = [...reading].at(-1);
  return `${reading.slice(0, -1)}${forms[ending] ?? `${ending}ます`}`;
}

function makeVocabularyExamples(reading, meaning) {
  if (specialExamples[reading]) {
    return specialExamples[reading].map(([jp, vi]) => ({ jp, kana: jp, vi }));
  }
  if (meaning === 'tôi') {
    return [
      { jp: 'わたしは がくせいです。', kana: 'わたしは がくせいです。', vi: 'Tôi là học sinh.' },
      { jp: 'わたしは にほんごを べんきょうします。', kana: 'わたしは にほんごを べんきょうします。', vi: 'Tôi học tiếng Nhật.' },
    ];
  }
  if (meaning === 'tên') {
    return [
      { jp: 'なまえを おしえてください。', kana: 'なまえを おしえてください。', vi: 'Xin hãy cho tôi biết tên.' },
      { jp: 'なまえを かみに かきます。', kana: 'なまえを かみに かきます。', vi: 'Tôi viết tên lên giấy.' },
    ];
  }
  if (verbMeanings.has(meaning)) {
    const polite = masuForm(reading);
    return [
      { jp: `まいにち ${polite}。`, kana: `まいにち ${polite}。`, vi: `Tôi ${meaning} mỗi ngày.` },
      { jp: `にちようびも ${polite}。`, kana: `にちようびも ${polite}。`, vi: `Chủ nhật tôi cũng ${meaning}.` },
    ];
  }

  if (['dễ', 'khó', 'yên lặng', 'yên tĩnh'].includes(meaning)) {
    return [
      { jp: `この へやは とても ${reading}です。`, kana: `この へやは とても ${reading}です。`, vi: `Căn phòng này rất ${meaning}.` },
      { jp: `あの へやも ${reading}です。`, kana: `あの へやも ${reading}です。`, vi: `Căn phòng kia cũng ${meaning}.` },
    ];
  }

  return [
    { jp: `わたしは ${reading}が すきです。`, kana: `わたしは ${reading}が すきです。`, vi: `Tôi thích ${meaning}.` },
    { jp: `きょう、${reading}について はなします。`, kana: `きょう、${reading}について はなします。`, vi: `Hôm nay tôi nói về ${meaning}.` },
  ];
}

function makeLesson(seed) {
  const [id, title, words, grammarSeeds, readingSeed, writing] = seed;
  const allWords = [...words, ...additionalWords[id]];
  const vocabulary = allWords.map(([jp, kana, vi]) => ({
    jp,
    kana,
    vi,
    examples: makeVocabularyExamples(kana, vi),
  }));
  const grammar = grammarSeeds.map(([pattern, explanation, jp, kana, vi]) => ({
    pattern,
    explanation,
    examples: [{ jp, kana, vi }],
  }));
  const reading = {
    jp: readingSeed[0],
    kana: readingSeed[1],
    vi: readingSeed[2],
    questions: [
      makeReadQuestion(`l${id}-read-1`, readingSeed[3]),
      makeReadQuestion(`l${id}-read-2`, readingSeed[4]),
    ],
  };
  const vocabOptionsA = makeOptions(words.slice(0, 4).map((word) => word[2]), `l${id}-vocab-a`);
  const vocabOptionsB = makeOptions(words.slice(4, 8).map((word) => word[2]), `l${id}-vocab-b`);
  const grammarDistractors = [
    ...allWords.map(([, , meaning]) => meaning),
    ...reading.questions.flatMap((question) => question.options.map((option) => option.text)),
    ...grammar.flatMap((point) => point.examples.map((example) => example.vi)),
  ];
  const quiz = [
    { id: `l${id}-quiz-v1`, prompt: `「${words[0][0]}」 có nghĩa là gì?`, options: vocabOptionsA, answerId: vocabOptionsA[0].id, explanation: `${words[0][0]} (${words[0][1]}) nghĩa là ${words[0][2]}.` },
    { id: `l${id}-quiz-v2`, prompt: `「${words[5][0]}」 có nghĩa là gì?`, options: vocabOptionsB, answerId: vocabOptionsB[1].id, explanation: `${words[5][0]} (${words[5][1]}) nghĩa là ${words[5][2]}.` },
    { id: `l${id}-quiz-reading`, prompt: reading.questions[0].prompt, options: reading.questions[0].options, answerId: reading.questions[0].answerId, explanation: reading.questions[0].explanation },
    makeGrammarMeaningQuestion(`l${id}-quiz-g1`, grammar[0].examples[0], grammarDistractors),
    makeGrammarMeaningQuestion(`l${id}-quiz-g2`, grammar[1].examples[0], grammarDistractors),
  ];
  const [titleJa, titleKana] = lessonTitles[id - 1];
  return { id, title, titleJa, titleKana, vocabulary, grammar, reading, writing, quiz };
}

const seeds = [
  [1, 'Chào hỏi và giới thiệu bản thân', [
    ['私', 'わたし', 'tôi'], ['名前', 'なまえ', 'tên'], ['学生', 'がくせい', 'học sinh'], ['先生', 'せんせい', 'giáo viên'],
    ['日本', 'にほん', 'Nhật Bản'], ['ベトナム', 'べとなむ', 'Việt Nam'], ['友だち', 'ともだち', 'bạn bè'], ['言葉', 'ことば', 'từ ngữ'],
  ], [
    ['N1 は N2 です', 'Dùng は để nêu chủ đề; です kết thúc câu lịch sự.', 'わたしは がくせいです。', 'わたしは がくせいです。', 'Tôi là học sinh.'],
    ['N1 も N2 です', 'も mang nghĩa “cũng”, thay cho は khi thông tin giống nhau.', 'ミンさんも がくせいです。', 'みんさんも がくせいです。', 'Bạn Minh cũng là học sinh.'],
  ], ['はじめまして。わたしはランです。ベトナムじんです。どうぞよろしく。', 'はじめまして。わたしはらんです。べとなむじんです。どうぞよろしく。', 'Rất vui được gặp bạn. Tôi là Lan, người Việt Nam. Mong được giúp đỡ.',
    ['Lan là người nước nào?', ['Nhật Bản', 'Việt Nam', 'Thái Lan'], 1, 'Lan nói ベトナムじんです, nghĩa là người Việt Nam.'],
    ['Lan nói gì ở cuối lời chào?', ['Cảm ơn', 'Tạm biệt', 'Mong được giúp đỡ'], 2, 'どうぞよろしく là lời chào làm quen lịch sự.']],
    { prompt: 'Viết 3 câu tự giới thiệu: tên, quốc tịch và nghề nghiệp/học tập.', hints: ['わたしは ___ です。', '___ じんです。', 'がくせいです。'], sample: 'わたしはアンです。ベトナムじんです。がくせいです。' }],
  [2, 'Quốc tịch, nghề nghiệp và ngôn ngữ', [
    ['国', 'くに', 'đất nước'], ['会社員', 'かいしゃいん', 'nhân viên công ty'], ['医者', 'いしゃ', 'bác sĩ'], ['店員', 'てんいん', 'nhân viên cửa hàng'],
    ['日本人', 'にほんじん', 'người Nhật'], ['ベトナム人', 'べとなむじん', 'người Việt'], ['英語', 'えいご', 'tiếng Anh'], ['日本語', 'にほんご', 'tiếng Nhật'],
  ], [
    ['N1 の N2', 'の nối hai danh từ, thường chỉ sở hữu hoặc mối liên hệ.', 'これは にほんごの ほんです。', 'これは にほんごの ほんです。', 'Đây là sách tiếng Nhật.'],
    ['N1 は N2 ですか', 'Đặt か ở cuối câu lịch sự để tạo câu hỏi có/không.', 'あなたは いしゃですか。', 'あなたは いしゃですか。', 'Bạn là bác sĩ phải không?'],
  ], ['マイさんはベトナムじんです。かいしゃいんです。にほんごとえいごをべんきょうします。', 'まいさんはべとなむじんです。かいしゃいんです。にほんごとえいごをべんきょうします。', 'Mai là người Việt Nam và là nhân viên công ty. Cô ấy học tiếng Nhật và tiếng Anh.',
    ['Mai là ai?', ['Nhân viên công ty', 'Bác sĩ', 'Giáo viên'], 0, 'Bài đọc nói かいしゃいんです.'],
    ['Mai học ngôn ngữ nào?', ['Chỉ tiếng Anh', 'Tiếng Nhật và tiếng Anh', 'Chỉ tiếng Nhật'], 1, 'にほんごとえいごをべんきょうします nghĩa là học tiếng Nhật và tiếng Anh.']],
    { prompt: 'Viết một đoạn ngắn về quốc tịch, nghề nghiệp và ngôn ngữ bạn học.', hints: ['___じんです。', '___です。', '___をべんきょうします。'], sample: 'ベトナムじんです。がくせいです。にほんごをべんきょうします。' }],
  [3, 'Đồ vật và lớp học', [
    ['本', 'ほん', 'sách'], ['机', 'つくえ', 'bàn'], ['椅子', 'いす', 'ghế'], ['鉛筆', 'えんぴつ', 'bút chì'],
    ['時計', 'とけい', 'đồng hồ'], ['鞄', 'かばん', 'cặp, túi'], ['辞書', 'じしょ', 'từ điển'], ['教室', 'きょうしつ', 'phòng học'],
  ], [
    ['これ / それ / あれ', 'これ là vật gần người nói; それ gần người nghe; あれ ở xa cả hai.', 'これは じしょです。', 'これは じしょです。', 'Đây là từ điển.'],
    ['この / その / あの + N', 'Các từ này đứng trước danh từ để bổ nghĩa cho đồ vật.', 'その ほんは わたしのです。', 'その ほんは わたしのです。', 'Quyển sách đó là của tôi.'],
  ], ['これはきょうしつです。つくえのうえにほんとじしょがあります。あのかばんはせんせいのです。', 'これはきょうしつです。つくえのうえにほんとじしょがあります。あのかばんはせんせいのです。', 'Đây là lớp học. Trên bàn có sách và từ điển. Cặp kia là của giáo viên.',
    ['Trên bàn có gì?', ['Sách và từ điển', 'Đồng hồ và cặp', 'Bút và ghế'], 0, 'Bài đọc nêu ほんとじしょがあります.'],
    ['Cặp ở xa là của ai?', ['Học sinh', 'Người nói', 'Giáo viên'], 2, 'せんせいのです nghĩa là của giáo viên.']],
    { prompt: 'Mô tả ba đồ vật quanh bạn bằng これ/それ/あれ hoặc この/その/あの.', hints: ['これは ___ です。', 'その ___ は ___ のです。'], sample: 'これはほんです。そのほんはわたしのです。あれはとけいです。' }],
  [4, 'Số đếm, tuổi và số điện thoại', [
    ['年齢', 'ねんれい', 'tuổi'], ['誕生日', 'たんじょうび', 'sinh nhật'], ['電話番号', 'でんわばんごう', 'số điện thoại'], ['番号', 'ばんごう', 'số hiệu'],
    ['歳', 'さい', 'tuổi'], ['円', 'えん', 'yên'], ['数字', 'すうじ', 'chữ số'], ['名前', 'なまえ', 'tên'],
  ], [
    ['何歳ですか', '何歳 hỏi tuổi; trả lời bằng số + 歳です.', 'わたしは はたちです。', 'わたしは はたちです。', 'Tôi 20 tuổi.'],
    ['何番ですか', '何番 hỏi số thứ tự hoặc số hiệu.', 'でんわばんごうは なんばんですか。', 'でんわばんごうは なんばんですか。', 'Số điện thoại là số mấy?'],
  ], ['わたしはじゅうきゅうさいです。たんじょうびはごがつみっかです。でんわばんごうは 090-1234-5678 です。', 'わたしはじゅうきゅうさいです。たんじょうびはごがつみっかです。でんわばんごうは 090-1234-5678 です。', 'Tôi 19 tuổi. Sinh nhật là ngày 3 tháng 5. Số điện thoại là 090-1234-5678.',
    ['Người nói bao nhiêu tuổi?', ['18 tuổi', '19 tuổi', '20 tuổi'], 1, 'じゅうきゅうさい là 19 tuổi.'],
    ['Sinh nhật là ngày nào?', ['Ngày 3 tháng 5', 'Ngày 5 tháng 3', 'Ngày 3 tháng 6'], 0, 'ごがつみっか là ngày 3 tháng 5.']],
    { prompt: 'Viết tuổi, sinh nhật và một số điện thoại mẫu của bạn (không dùng số thật nếu không muốn).', hints: ['___さいです。', 'たんじょうびは ___ です。', 'でんわばんごうは ___ です。'], sample: 'じゅうはっさいです。たんじょうびははちがつじゅうよっかです。' }],
  [5, 'Thời gian và lịch hằng ngày', [
    ['今', 'いま', 'bây giờ'], ['今日', 'きょう', 'hôm nay'], ['明日', 'あした', 'ngày mai'], ['朝', 'あさ', 'buổi sáng'],
    ['昼', 'ひる', 'buổi trưa'], ['夜', 'よる', 'buổi tối'], ['毎日', 'まいにち', 'mỗi ngày'], ['学校', 'がっこう', 'trường học'],
  ], [
    ['今、何時ですか', '何時 hỏi giờ; giờ được nói bằng số + 時.', 'いま ごじです。', 'いま ごじです。', 'Bây giờ là 5 giờ.'],
    ['Thời gian に Vます', 'に đánh dấu thời điểm cụ thể xảy ra hành động.', 'はちじに がっこうへ いきます。', 'はちじに がっこうへ いきます。', 'Tôi đi học lúc 8 giờ.'],
  ], ['まいあさろくじにおきます。しちじにあさごはんをたべます。はちじにがっこうへいきます。', 'まいあさろくじにおきます。しちじにあさごはんをたべます。はちじにがっこうへいきます。', 'Mỗi sáng tôi thức dậy lúc 6 giờ, ăn sáng lúc 7 giờ và đi học lúc 8 giờ.',
    ['Người nói thức dậy lúc mấy giờ?', ['6 giờ', '7 giờ', '8 giờ'], 0, 'ろくじにおきます nghĩa là thức dậy lúc 6 giờ.'],
    ['Người nói đi học lúc nào?', ['7 giờ', '8 giờ', '9 giờ'], 1, 'はちじにがっこうへいきます nghĩa là đi học lúc 8 giờ.']],
    { prompt: 'Viết lịch một ngày với ba mốc giờ.', hints: ['___じに おきます。', '___じに ___を たべます。', '___じに ___へ いきます。'], sample: 'ろくじにおきます。しちじにあさごはんをたべます。はちじにがっこうへいきます。' }],
  [6, 'Địa điểm và phương hướng', [
    ['駅', 'えき', 'nhà ga'], ['学校', 'がっこう', 'trường học'], ['銀行', 'ぎんこう', 'ngân hàng'], ['郵便局', 'ゆうびんきょく', 'bưu điện'],
    ['病院', 'びょういん', 'bệnh viện'], ['店', 'みせ', 'cửa hàng'], ['右', 'みぎ', 'bên phải'], ['左', 'ひだり', 'bên trái'],
  ], [
    ['ここ / そこ / あそこ', 'Chỉ nơi gần người nói, gần người nghe hoặc xa cả hai.', 'ゆうびんきょくは あそこです。', 'ゆうびんきょくは あそこです。', 'Bưu điện ở đằng kia.'],
    ['Địa điểm に N が あります', 'Dùng あります để nói có đồ vật hoặc địa điểm không sống ở đâu đó.', 'えきの まえに ぎんこうが あります。', 'えきの まえに ぎんこうが あります。', 'Trước ga có ngân hàng.'],
  ], ['えきのまえにぎんこうがあります。びょういんはみぎです。ゆうびんきょくはあのこうさてんをひだりです。', 'えきのまえにぎんこうがあります。びょういんはみぎです。ゆうびんきょくはあのこうさてんをひだりです。', 'Trước ga có ngân hàng. Bệnh viện ở bên phải. Bưu điện ở bên trái ngã tư kia.',
    ['Trước ga có gì?', ['Bệnh viện', 'Ngân hàng', 'Bưu điện'], 1, 'ぎんこうがあります nghĩa là có ngân hàng.'],
    ['Bệnh viện ở phía nào?', ['Bên phải', 'Bên trái', 'Phía trước'], 0, 'びょういんはみぎです nghĩa là bệnh viện ở bên phải.']],
    { prompt: 'Chỉ đường từ ga đến hai địa điểm gần nơi bạn ở.', hints: ['___は みぎです。', '___は ひだりです。', 'ここ / そこ / あそこ'], sample: 'びょういんはみぎです。ぎんこうはひだりです。' }],
  [7, 'Gia đình và con người', [
    ['家族', 'かぞく', 'gia đình'], ['父', 'ちち', 'bố mình'], ['母', 'はは', 'mẹ mình'], ['兄', 'あに', 'anh trai mình'],
    ['姉', 'あね', 'chị gái mình'], ['弟', 'おとうと', 'em trai mình'], ['妹', 'いもうと', 'em gái mình'], ['人', 'ひと', 'người'],
  ], [
    ['Người が います', 'います diễn tả sự tồn tại của người hoặc động vật.', 'わたしの いえに ねこが います。', 'わたしの いえに ねこが います。', 'Ở nhà tôi có một con mèo.'],
    ['N は ngườiです', 'Dùng は để đưa một người làm chủ đề rồi giới thiệu thông tin.', 'あには だいがくせいです。', 'あには だいがくせいです。', 'Anh trai tôi là sinh viên đại học.'],
  ], ['わたしのかぞくはよにんです。ちちはかいしゃいんで、はははせんせいです。あにはだいがくせいです。', 'わたしのかぞくはよにんです。ちちはかいしゃいんで、はははせんせいです。あにはだいがくせいです。', 'Gia đình tôi có bốn người. Bố là nhân viên công ty, mẹ là giáo viên và anh trai là sinh viên đại học.',
    ['Gia đình có mấy người?', ['3 người', '4 người', '5 người'], 1, 'よにん nghĩa là bốn người.'],
    ['Mẹ làm nghề gì?', ['Nhân viên công ty', 'Giáo viên', 'Bác sĩ'], 1, 'はははせんせいです nghĩa là mẹ là giáo viên.']],
    { prompt: 'Giới thiệu gia đình bằng số thành viên và nghề nghiệp của hai người.', hints: ['かぞくは ___ にんです。', 'ちちは ___ です。', 'ははは ___ です。'], sample: 'かぞくはよにんです。ちちはかいしゃいんです。はははせんせいです。' }],
  [8, 'Đồ ăn, thức uống và gọi món', [
    ['食べ物', 'たべもの', 'đồ ăn'], ['水', 'みず', 'nước'], ['お茶', 'おちゃ', 'trà'], ['ご飯', 'ごはん', 'cơm'],
    ['魚', 'さかな', 'cá'], ['肉', 'にく', 'thịt'], ['野菜', 'やさい', 'rau'], ['店', 'みせ', 'cửa hàng'],
  ], [
    ['N をください', 'を đánh dấu vật được yêu cầu; ください là “làm ơn cho tôi”.', 'みずを ください。', 'みずを ください。', 'Làm ơn cho tôi nước.'],
    ['N を 食べます / 飲みます', 'を đánh dấu món được ăn hoặc thức uống được uống.', 'さかなを たべます。', 'さかなを たべます。', 'Tôi ăn cá.'],
  ], ['レストランでみずとおちゃをたのみます。わたしはさかなとやさいをたべます。ともだちはにくをたべます。', 'れすとらんでみずとおちゃをたのみます。わたしはさかなとやさいをたべます。ともだちはにくをたべます。', 'Ở nhà hàng, tôi gọi nước và trà. Tôi ăn cá và rau. Bạn tôi ăn thịt.',
    ['Người nói gọi gì?', ['Nước và trà', 'Cà phê và sữa', 'Cá và thịt'], 0, 'みずとおちゃをたのみます nghĩa là gọi nước và trà.'],
    ['Bạn của người nói ăn gì?', ['Rau', 'Cá', 'Thịt'], 2, 'ともだちはにくをたべます nghĩa là bạn ăn thịt.']],
    { prompt: 'Viết một lượt gọi món gồm đồ uống và hai món ăn.', hints: ['___をください。', '___と___をたべます。'], sample: 'みずをください。さかなとやさいをたべます。' }],
  [9, 'Mua sắm và giá cả', [
    ['値段', 'ねだん', 'giá cả'], ['円', 'えん', 'yên'], ['服', 'ふく', 'quần áo'], ['靴', 'くつ', 'giày'],
    ['鞄', 'かばん', 'túi xách'], ['店', 'みせ', 'cửa hàng'], ['百', 'ひゃく', 'một trăm'], ['千', 'せん', 'một nghìn'],
  ], [
    ['いくらですか', 'いくら hỏi giá; trả lời số tiền + 円です.', 'この くつは さんぜんえんです。', 'この くつは さんぜんえんです。', 'Đôi giày này giá 3.000 yên.'],
    ['これをください', 'これ chỉ món hàng gần người nói; câu lịch sự khi chọn mua.', 'その かばんを ください。', 'その かばんを ください。', 'Làm ơn cho tôi chiếc túi đó.'],
  ], ['このみせでくつをみます。このくつはいくらですか。さんぜんえんです。じゃあ、これをください。', 'このみせでくつをみます。このくつはいくらですか。さんぜんえんです。じゃあ、これをください。', 'Tôi xem giày ở cửa hàng này. Đôi giày này giá bao nhiêu? 3.000 yên. Vậy cho tôi đôi này.',
    ['Đôi giày giá bao nhiêu?', ['1.000 yên', '2.000 yên', '3.000 yên'], 2, 'さんぜんえん là 3.000 yên.'],
    ['Người nói quyết định làm gì?', ['Mua đôi giày', 'Mua chiếc túi', 'Rời cửa hàng'], 0, 'これをください là câu chọn mua món hàng.']],
    { prompt: 'Viết hội thoại ngắn hỏi giá một món đồ và quyết định mua.', hints: ['これはいくらですか。', '___えんです。', 'これをください。'], sample: 'このかばんはいくらですか。にせんえんです。じゃあ、これをください。' }],
  [10, 'Sinh hoạt thường ngày', [
    ['起きる', 'おきる', 'thức dậy'], ['食べる', 'たべる', 'ăn'], ['飲む', 'のむ', 'uống'], ['行く', 'いく', 'đi'],
    ['帰る', 'かえる', 'trở về'], ['寝る', 'ねる', 'ngủ'], ['毎日', 'まいにち', 'mỗi ngày'], ['時間', 'じかん', 'thời gian'],
  ], [
    ['Vます', 'Dạng ます diễn tả hành động hiện tại/thói quen theo cách lịch sự.', 'まいにち ごはんを たべます。', 'まいにち ごはんを たべます。', 'Tôi ăn cơm mỗi ngày.'],
    ['N を Vます', 'を đứng sau tân ngữ trực tiếp của hành động.', 'みずを のみます。', 'みずを のみます。', 'Tôi uống nước.'],
  ], ['まいあさろくじにおきます。あさごはんをたべて、でんしゃでがっこうへいきます。ごごごじにうちへかえります。', 'まいあさろくじにおきます。あさごはんをたべて、でんしゃでがっこうへいきます。ごごごじにうちへかえります。', 'Mỗi sáng tôi dậy lúc 6 giờ, ăn sáng rồi đi tàu đến trường. 5 giờ chiều tôi về nhà.',
    ['Người nói đi học bằng gì?', ['Xe buýt', 'Tàu điện', 'Xe đạp'], 1, 'でんしゃでがっこうへいきます nghĩa là đi tàu điện đến trường.'],
    ['Người nói về nhà lúc mấy giờ?', ['4 giờ chiều', '5 giờ chiều', '6 giờ chiều'], 1, 'ごごごじ là 5 giờ chiều.']],
    { prompt: 'Viết lịch sinh hoạt ba việc trong ngày bằng dạng ます.', hints: ['___じにおきます。', '___をたべます。', 'うちへかえります。'], sample: 'ろくじにおきます。あさごはんをたべます。ごごごじにうちへかえります。' }],
  [11, 'Trường học và công việc', [
    ['大学', 'だいがく', 'đại học'], ['会社', 'かいしゃ', 'công ty'], ['先生', 'せんせい', 'giáo viên'], ['学生', 'がくせい', 'sinh viên'],
    ['仕事', 'しごと', 'công việc'], ['休み', 'やすみ', 'ngày nghỉ'], ['宿題', 'しゅくだい', 'bài tập về nhà'], ['教室', 'きょうしつ', 'phòng học'],
  ], [
    ['Địa điểm で Vます', 'で chỉ nơi diễn ra một hành động.', 'としょかんで べんきょうします。', 'としょかんで べんきょうします。', 'Tôi học ở thư viện.'],
    ['何をしますか', '何を hỏi làm gì; trả lời bằng tân ngữ + を + động từ.', 'きょう しゅくだいを します。', 'きょう しゅくだいを します。', 'Hôm nay tôi làm bài tập.'],
  ], ['たなかさんはだいがくのせんせいです。きょうしつでにほんごをおしえます。どようびはやすみです。', 'たなかさんはだいがくのせんせいです。きょうしつでにほんごをおしえます。どようびはやすみです。', 'Thầy Tanaka là giảng viên đại học. Thầy dạy tiếng Nhật trong lớp. Thứ Bảy là ngày nghỉ.',
    ['Thầy Tanaka làm việc ở đâu?', ['Đại học', 'Bệnh viện', 'Cửa hàng'], 0, 'だいがくのせんせい là giáo viên đại học.'],
    ['Thứ Bảy là ngày gì?', ['Ngày đi làm', 'Ngày nghỉ', 'Ngày kiểm tra'], 1, 'どようびはやすみです nghĩa là thứ Bảy nghỉ.']],
    { prompt: 'Viết 3 câu về nơi học/làm, việc bạn làm và ngày nghỉ.', hints: ['___でべんきょうします。', '___をします。', '___はやすみです。'], sample: 'だいがくでべんきょうします。にほんごのしゅくだいをします。にちようびはやすみです。' }],
  [12, 'Sở thích và hoạt động', [
    ['音楽', 'おんがく', 'âm nhạc'], ['映画', 'えいが', 'phim'], ['スポーツ', 'すぽーつ', 'thể thao'], ['写真', 'しゃしん', 'ảnh'],
    ['旅行', 'りょこう', 'du lịch'], ['読書', 'どくしょ', 'đọc sách'], ['好き', 'すき', 'yêu thích'], ['上手', 'じょうず', 'giỏi'],
  ], [
    ['N が好きです', 'が đánh dấu điều mình thích trước 好きです.', 'わたしは おんがくが すきです。', 'わたしは おんがくが すきです。', 'Tôi thích âm nhạc.'],
    ['どんな N', 'どんな hỏi loại/kiểu nào và đứng ngay trước danh từ.', 'どんな えいがが すきですか。', 'どんな えいがが すきですか。', 'Bạn thích phim thể loại nào?'],
  ], ['わたしはえいがとおんがくがすきです。しゅうまつにともだちとえいがをみます。ともだちはしゃしんがじょうずです。', 'わたしはえいがとおんがくがすきです。しゅうまつにともだちとえいがをみます。ともだちはしゃしんがじょうずです。', 'Tôi thích phim và âm nhạc. Cuối tuần tôi xem phim với bạn. Bạn tôi chụp ảnh giỏi.',
    ['Người nói làm gì cuối tuần?', ['Xem phim với bạn', 'Đi du lịch một mình', 'Đọc sách ở nhà'], 0, 'ともだちとえいがをみます nghĩa là xem phim với bạn.'],
    ['Bạn của người nói giỏi việc gì?', ['Chơi thể thao', 'Chụp ảnh', 'Chơi nhạc'], 1, 'しゃしんがじょうずです nghĩa là chụp ảnh giỏi.']],
    { prompt: 'Viết về hai sở thích và một hoạt động bạn làm cuối tuần.', hints: ['___がすきです。', 'しゅうまつに___をします。'], sample: 'おんがくとどくしょがすきです。しゅうまつにほんをよみます。' }],
  [13, 'Thời tiết và mùa', [
    ['天気', 'てんき', 'thời tiết'], ['雨', 'あめ', 'mưa'], ['雪', 'ゆき', 'tuyết'], ['晴れ', 'はれ', 'trời nắng'],
    ['曇り', 'くもり', 'trời nhiều mây'], ['春', 'はる', 'mùa xuân'], ['夏', 'なつ', 'mùa hè'], ['冬', 'ふゆ', 'mùa đông'],
  ], [
    ['い-adjective です', 'Tính từ đuôi い đứng trước です để miêu tả lịch sự.', 'きょうは あついです。', 'きょうは あついです。', 'Hôm nay trời nóng.'],
    ['な-adjective です', 'Tính từ な đi với danh từ; cuối câu có thể dùng な + です.', 'はるは しずかです。', 'はるは しずかです。', 'Mùa xuân yên bình.'],
  ], ['きょうははれです。なつはあついですが、はるはあたたかいです。ふゆにゆきがふります。', 'きょうははれです。なつはあついですが、はるはあたたかいです。ふゆにゆきがふります。', 'Hôm nay trời nắng. Mùa hè nóng nhưng mùa xuân ấm áp. Mùa đông có tuyết rơi.',
    ['Mùa nào ấm áp?', ['Mùa đông', 'Mùa hè', 'Mùa xuân'], 2, 'はるはあたたかい nghĩa là mùa xuân ấm áp.'],
    ['Mùa nào có tuyết?', ['Mùa đông', 'Mùa xuân', 'Mùa hè'], 0, 'ふゆにゆきがふります nghĩa là mùa đông có tuyết rơi.']],
    { prompt: 'Mô tả thời tiết hôm nay và mùa bạn thích.', hints: ['きょうは ___ です。', '___は___です。', '___がすきです。'], sample: 'きょうははれです。なつはあついです。はるがすきです。' }],
  [14, 'Phương tiện và đi lại', [
    ['電車', 'でんしゃ', 'tàu điện'], ['地下鉄', 'ちかてつ', 'tàu điện ngầm'], ['バス', 'ばす', 'xe buýt'], ['車', 'くるま', 'ô tô'],
    ['自転車', 'じてんしゃ', 'xe đạp'], ['駅', 'えき', 'nhà ga'], ['切符', 'きっぷ', 'vé'], ['道', 'みち', 'con đường'],
  ], [
    ['Phương tiện で 行きます', 'で chỉ phương tiện đi lại.', 'でんしゃで えきへ いきます。', 'でんしゃで えきへ いきます。', 'Tôi đi tàu đến ga.'],
    ['N1 から N2 まで', 'から chỉ điểm bắt đầu, まで chỉ điểm kết thúc.', 'うちから かいしゃまで いきます。', 'うちから かいしゃまで いきます。', 'Tôi đi từ nhà đến công ty.'],
  ], ['まいあさちかてつでえきへいきます。えきからかいしゃまででんしゃにのります。きっぷは三百円です。', 'まいあさちかてつでえきへいきます。えきからかいしゃまででんしゃにのります。きっぷはさんびゃくえんです。', 'Mỗi sáng tôi đi tàu điện ngầm đến ga. Từ ga tôi đi tàu điện đến công ty. Vé giá 300 yên.',
    ['Người nói đi đến ga bằng gì?', ['Tàu điện ngầm', 'Xe buýt', 'Xe đạp'], 0, 'ちかてつでえきへいきます nghĩa là đi tàu điện ngầm đến ga.'],
    ['Vé giá bao nhiêu?', ['100 yên', '200 yên', '300 yên'], 2, 'さんびゃくえん là 300 yên.']],
    { prompt: 'Viết đường đi từ nhà đến trường hoặc nơi làm việc.', hints: ['___から___までいきます。', '___でいきます。'], sample: 'うちからだいがくまでいきます。でんしゃでいきます。' }],
  [15, 'Nhà ở và vị trí đồ vật', [
    ['家', 'いえ', 'nhà'], ['部屋', 'へや', 'phòng'], ['台所', 'だいどころ', 'nhà bếp'], ['机', 'つくえ', 'bàn'],
    ['椅子', 'いす', 'ghế'], ['窓', 'まど', 'cửa sổ'], ['中', 'なか', 'bên trong'], ['外', 'そと', 'bên ngoài'],
  ], [
    ['N の上 / 下 / 中', 'の nối danh từ chỉ nơi với từ chỉ vị trí.', 'つくえの うえに ほんが あります。', 'つくえの うえに ほんが あります。', 'Trên bàn có sách.'],
    ['N は nơi に あります', 'Nêu đồ vật trước, sau đó chỉ vị trí của nó.', 'ねこは へやの なかに います。', 'ねこは へやの なかに います。', 'Con mèo ở trong phòng.'],
  ], ['わたしのへやはちいさいです。まどのちかくにつくえがあります。いすはつくえのまえです。', 'わたしのへやはちいさいです。まどのちかくにつくえがあります。いすはつくえのまえです。', 'Phòng tôi nhỏ. Gần cửa sổ có bàn. Ghế ở phía trước bàn.',
    ['Cái bàn ở đâu?', ['Gần cửa sổ', 'Ngoài nhà', 'Trong bếp'], 0, 'まどのちかくにつくえがあります nghĩa là bàn ở gần cửa sổ.'],
    ['Cái ghế ở đâu?', ['Sau bàn', 'Trước bàn', 'Trên bàn'], 1, 'いすはつくえのまえです nghĩa là ghế ở phía trước bàn.']],
    { prompt: 'Mô tả phòng bằng ít nhất ba vị trí đồ vật.', hints: ['___のちかくに___があります。', '___は___のうえです。', '___はへやのなかです。'], sample: 'まどのちかくにつくえがあります。ほんはつくえのうえです。いすはへやのなかです。' }],
  [16, 'Tính từ miêu tả', [
    ['高い', 'たかい', 'cao, đắt'], ['安い', 'やすい', 'rẻ'], ['新しい', 'あたらしい', 'mới'], ['古い', 'ふるい', 'cũ'],
    ['大きい', 'おおきい', 'to, lớn'], ['小さい', 'ちいさい', 'nhỏ'], ['静か', 'しずか', 'yên tĩnh'], ['便利', 'べんり', 'tiện lợi'],
  ], [
    ['い-adjective + N', 'Tính từ đuôi い đứng trực tiếp trước danh từ.', 'あたらしい くるまです。', 'あたらしい くるまです。', 'Đó là chiếc xe mới.'],
    ['な-adjective + な + N', 'Tính từ な cần な khi đứng trước danh từ.', 'しずかな まちです。', 'しずかな まちです。', 'Đó là thành phố yên tĩnh.'],
  ], ['このまちはしずかで、べんりです。えきのちかくにあたらしいみせがあります。ふるいみせはやすいです。', 'このまちはしずかで、べんりです。えきのちかくにあたらしいみせがあります。ふるいみせはやすいです。', 'Thành phố này yên tĩnh và tiện lợi. Gần ga có cửa hàng mới. Cửa hàng cũ thì rẻ.',
    ['Thành phố này như thế nào?', ['Yên tĩnh và tiện lợi', 'Ồn và đắt', 'Nhỏ và xa'], 0, 'しずかで、べんりです mô tả thành phố yên tĩnh và tiện lợi.'],
    ['Cửa hàng nào rẻ?', ['Cửa hàng mới', 'Cửa hàng cũ', 'Cửa hàng gần ga'], 1, 'ふるいみせはやすいです nghĩa là cửa hàng cũ rẻ.']],
    { prompt: 'Miêu tả một nơi hoặc đồ vật bằng một tính từ い và một tính từ な.', hints: ['___い___です。', '___な___です。'], sample: 'このへやはひろいです。しずかなへやです。' }],
  [17, 'Khả năng và mong muốn', [
    ['日本語', 'にほんご', 'tiếng Nhật'], ['英語', 'えいご', 'tiếng Anh'], ['料理', 'りょうり', 'nấu ăn'], ['運転', 'うんてん', 'lái xe'],
    ['泳ぐ', 'およぐ', 'bơi'], ['上手', 'じょうず', 'giỏi'], ['下手', 'へた', 'kém'], ['欲しい', 'ほしい', 'muốn có'],
  ], [
    ['N ができます', 'できます diễn tả khả năng làm được hoặc biết làm việc gì.', 'にほんごが できます。', 'にほんごが できます。', 'Tôi biết tiếng Nhật.'],
    ['Vたいです', 'Bỏ ます rồi thêm たいです để nói mong muốn làm gì.', 'にほんへ いきたいです。', 'にほんへ いきたいです。', 'Tôi muốn đến Nhật.'],
  ], ['わたしはにほんごがすこしできます。りょうりはまだへたですが、じょうずになりたいです。らいねんにほんへいきたいです。', 'わたしはにほんごがすこしできます。りょうりはまだへたですが、じょうずになりたいです。らいねんにほんへいきたいです。', 'Tôi biết một chút tiếng Nhật. Tôi nấu ăn chưa giỏi nhưng muốn giỏi hơn. Năm sau tôi muốn đi Nhật.',
    ['Người nói muốn làm gì?', ['Đi Nhật năm sau', 'Đổi công việc', 'Học lái xe'], 0, 'らいねんにほんへいきたいです nghĩa là năm sau muốn đi Nhật.'],
    ['Người nói tự nhận mình nấu ăn thế nào?', ['Rất giỏi', 'Chưa giỏi', 'Không thích'], 1, 'りょうりはまだへた nghĩa là nấu ăn vẫn chưa giỏi.']],
    { prompt: 'Viết một điều bạn có thể làm và hai việc bạn muốn làm.', hints: ['___ができます。', '___たいです。'], sample: 'にほんごがすこしできます。りょうりをしたいです。にほんへいきたいです。' }],
  [18, 'Rủ rê, hẹn gặp và lời mời', [
    ['約束', 'やくそく', 'cuộc hẹn'], ['時間', 'じかん', 'thời gian'], ['日曜日', 'にちようび', 'Chủ nhật'], ['土曜日', 'どようび', 'Thứ Bảy'],
    ['今週', 'こんしゅう', 'tuần này'], ['来週', 'らいしゅう', 'tuần sau'], ['友だち', 'ともだち', 'bạn bè'], ['電話', 'でんわ', 'điện thoại'],
  ], [
    ['Vませんか', 'Cách lịch sự để mời hoặc rủ ai đó cùng làm việc gì.', 'いっしょに えいがを みませんか。', 'いっしょに えいがを みませんか。', 'Cùng xem phim nhé?'],
    ['Vましょう', 'Dùng để đề nghị cùng làm hoặc nhận lời rủ.', 'こうえんへ いきましょう。', 'こうえんへ いきましょう。', 'Cùng đi công viên nhé.'],
  ], ['らいしゅうのにちようび、いっしょにえいがをみませんか。ごごさんじはどうですか。いいですね。えきであいましょう。', 'らいしゅうのにちようび、いっしょにえいがをみませんか。ごごさんじはどうですか。いいですね。えきであいましょう。', 'Chủ nhật tuần sau cùng xem phim nhé? 3 giờ chiều được không? Được đấy. Hẹn gặp ở ga nhé.',
    ['Cuộc hẹn vào ngày nào?', ['Chủ nhật tuần sau', 'Thứ Bảy tuần này', 'Chủ nhật tuần này'], 0, 'らいしゅうのにちようび là Chủ nhật tuần sau.'],
    ['Họ gặp nhau ở đâu?', ['Ở rạp phim', 'Ở ga', 'Ở công viên'], 1, 'えきであいましょう nghĩa là gặp ở ga.']],
    { prompt: 'Viết lời mời bạn đi xem phim và xác nhận ngày, giờ, địa điểm.', hints: ['いっしょに___ませんか。', '___はどうですか。', '___であいましょう。'], sample: 'いっしょにえいがをみませんか。にちようびのごごさんじはどうですか。えきであいましょう。' }],
  [19, 'Sức khỏe và cơ thể', [
    ['頭', 'あたま', 'đầu'], ['お腹', 'おなか', 'bụng'], ['喉', 'のど', 'cổ họng'], ['手', 'て', 'tay'],
    ['足', 'あし', 'chân'], ['病気', 'びょうき', 'bệnh'], ['薬', 'くすり', 'thuốc'], ['医者', 'いしゃ', 'bác sĩ'],
  ], [
    ['N が痛いです', 'が đánh dấu bộ phận bị đau.', 'あたまが いたいです。', 'あたまが いたいです。', 'Tôi đau đầu.'],
    ['Vてください', 'Dùng thể て + ください để yêu cầu hoặc dặn dò lịch sự.', 'くすりを のんでください。', 'くすりを のんでください。', 'Hãy uống thuốc.'],
  ], ['きのうからのどがいたいです。びょういんへいきました。いしゃは「くすりをのんで、よくやすんでください」といいました。', 'きのうからのどがいたいです。びょういんへいきました。いしゃは「くすりをのんで、よくやすんでください」といいました。', 'Từ hôm qua tôi đau họng. Tôi đã đến bệnh viện. Bác sĩ dặn uống thuốc và nghỉ ngơi nhiều.',
    ['Người nói đau ở đâu?', ['Đầu', 'Cổ họng', 'Bụng'], 1, 'のどがいたいです nghĩa là đau họng.'],
    ['Bác sĩ dặn làm gì?', ['Uống thuốc và nghỉ ngơi', 'Đi làm', 'Tập thể thao'], 0, 'くすりをのんで、よくやすんでください là uống thuốc và nghỉ ngơi.']],
    { prompt: 'Viết câu mô tả triệu chứng và lời khuyên dành cho người đó.', hints: ['___がいたいです。', 'くすりをのんでください。', 'よくやすんでください。'], sample: 'あたまがいたいです。くすりをのんで、よくやすんでください。' }],
  [20, 'Quá khứ và trải nghiệm gần gũi', [
    ['昨日', 'きのう', 'hôm qua'], ['先週', 'せんしゅう', 'tuần trước'], ['去年', 'きょねん', 'năm ngoái'], ['旅行', 'りょこう', 'du lịch'],
    ['買い物', 'かいもの', 'mua sắm'], ['映画', 'えいが', 'phim'], ['休み', 'やすみ', 'ngày nghỉ'], ['天気', 'てんき', 'thời tiết'],
  ], [
    ['Nでした', 'Dạng quá khứ lịch sự của câu danh từ là Nでした.', 'きのうは やすみでした。', 'きのうは やすみでした。', 'Hôm qua là ngày nghỉ.'],
    ['Vました', 'Dạng quá khứ lịch sự của động từ ます là Vました.', 'きょねん にほんへ いきました。', 'きょねん にほんへ いきました。', 'Năm ngoái tôi đã đi Nhật.'],
  ], ['せんしゅうのやすみにきょうとへいきました。てんきはよかったです。きれいなえいがをみて、おみやげをかいました。', 'せんしゅうのやすみにきょうとへいきました。てんきはよかったです。きれいなえいがをみて、おみやげをかいました。', 'Kỳ nghỉ tuần trước tôi đã đến Kyoto. Thời tiết đẹp. Tôi xem một bộ phim hay và mua quà lưu niệm.',
    ['Người nói đã đi đâu?', ['Tokyo', 'Kyoto', 'Osaka'], 1, 'きょうとへいきました nghĩa là đã đi Kyoto.'],
    ['Người nói đã mua gì?', ['Quần áo', 'Sách', 'Quà lưu niệm'], 2, 'おみやげをかいました nghĩa là đã mua quà lưu niệm.']],
    { prompt: 'Kể ngắn về một ngày nghỉ gần đây bằng ít nhất hai động từ quá khứ.', hints: ['___へいきました。', '___をみました。', '___をかいました。'], sample: 'せんしゅうこうえんへいきました。えいがをみて、おみやげをかいました。' }],
  [21, 'Quy tắc, yêu cầu và chỉ dẫn', [
    ['入口', 'いりぐち', 'lối vào'], ['出口', 'でぐち', 'lối ra'], ['禁止', 'きんし', 'cấm'], ['右', 'みぎ', 'bên phải'],
    ['左', 'ひだり', 'bên trái'], ['静か', 'しずか', 'yên lặng'], ['写真', 'しゃしん', 'ảnh'], ['名前', 'なまえ', 'tên'],
  ], [
    ['Vてください', 'Dùng để đưa ra yêu cầu hoặc hướng dẫn lịch sự.', 'ここに なまえを かいてください。', 'ここに なまえを かいてください。', 'Hãy viết tên vào đây.'],
    ['Vてもいいですか', 'Hỏi xin phép làm việc gì; trả lời はい、いいです hoặc だめです.', 'しゃしんを とってもいいですか。', 'しゃしんを とってもいいですか。', 'Tôi chụp ảnh được không?'],
  ], ['ここはとしょかんです。しずかにしてください。なかでしゃしんをとってもいいですか。いいえ、しゃしんは禁止です。', 'ここはとしょかんです。しずかにしてください。なかでしゃしんをとってもいいですか。いいえ、しゃしんはきんしです。', 'Đây là thư viện. Xin hãy giữ yên lặng. Có được chụp ảnh bên trong không? Không, chụp ảnh bị cấm.',
    ['Ở thư viện cần làm gì?', ['Nói to', 'Giữ yên lặng', 'Chụp ảnh'], 1, 'しずかにしてください nghĩa là xin giữ yên lặng.'],
    ['Có được chụp ảnh không?', ['Được', 'Không, bị cấm', 'Chỉ bên ngoài'], 1, 'しゃしんはきんしです nghĩa là chụp ảnh bị cấm.']],
    { prompt: 'Viết ba hướng dẫn lịch sự cho khách trong một địa điểm.', hints: ['___してください。', '___てもいいですか。', '___は禁止です。'], sample: 'しずかにしてください。ここにすわってください。しゃしんをとってもいいですか。' }],
  [22, 'So sánh và lựa chọn', [
    ['どちら', 'どちら', 'cái nào (trong hai)'], ['方', 'ほう', 'phía, lựa chọn'], ['違い', 'ちがい', 'sự khác nhau'], ['同じ', 'おなじ', 'giống nhau'],
    ['一番', 'いちばん', 'nhất'], ['好き', 'すき', 'yêu thích'], ['色', 'いろ', 'màu sắc'], ['服', 'ふく', 'quần áo'],
  ], [
    ['A と B と どちら', 'Mẫu hỏi lựa chọn giữa hai thứ; trả lời A/B のほうが…です.', 'コーヒーと おちゃと どちらが すきですか。', 'こーひーと おちゃと どちらが すきですか。', 'Bạn thích cà phê hay trà hơn?'],
    ['N1 より N2 のほうが', 'So sánh hai vật, N2 có đặc điểm hơn N1.', 'でんしゃより ちかてつのほうが はやいです。', 'でんしゃより ちかてつのほうが はやいです。', 'Tàu điện ngầm nhanh hơn tàu điện.'],
  ], ['あかいふくとあおいふくとどちらがすきですか。あおいふくのほうがすきです。あかいふくよりやすいです。', 'あかいふくとあおいふくとどちらがすきですか。あおいふくのほうがすきです。あかいふくよりやすいです。', 'Bạn thích áo đỏ hay áo xanh hơn? Tôi thích áo xanh hơn. Nó rẻ hơn áo đỏ.',
    ['Người trả lời thích áo màu gì?', ['Đỏ', 'Xanh', 'Trắng'], 1, 'あおいふくのほうがすきです nghĩa là thích áo xanh hơn.'],
    ['Áo xanh so với áo đỏ thế nào?', ['Đắt hơn', 'Rẻ hơn', 'Cũ hơn'], 1, 'あかいふくよりやすい nghĩa là rẻ hơn áo đỏ.']],
    { prompt: 'So sánh hai món ăn, phương tiện hoặc màu bạn thích.', hints: ['AとBとどちらがすきですか。', 'Bのほうがすきです。', 'Aより___です。'], sample: 'でんしゃとバスとどちらがすきですか。でんしゃのほうがすきです。バスよりはやいです。' }],
  [23, 'Kế hoạch và dự định', [
    ['予定', 'よてい', 'dự định, lịch'], ['来月', 'らいげつ', 'tháng sau'], ['来年', 'らいねん', 'năm sau'], ['未来', 'みらい', 'tương lai'],
    ['明日', 'あした', 'ngày mai'], ['週末', 'しゅうまつ', 'cuối tuần'], ['準備', 'じゅんび', 'sự chuẩn bị'], ['計画', 'けいかく', 'kế hoạch'],
  ], [
    ['Vるつもりです', 'Thể từ điển + つもりです diễn tả dự định.', 'らいねん にほんへ いくつもりです。', 'らいねん にほんへ いくつもりです。', 'Năm sau tôi dự định đi Nhật.'],
    ['Thời gian に Vます', 'に đánh dấu mốc thời gian cụ thể cho kế hoạch.', 'あした ともだちに あいます。', 'あした ともだちに あいます。', 'Ngày mai tôi gặp bạn.'],
  ], ['らいげつからにほんごのクラスをはじめるつもりです。しゅうまつにじゅんびをします。らいねんにほんへいくけいかくがあります。', 'らいげつからにほんごのくらすをはじめるつもりです。しゅうまつにじゅんびをします。らいねんにほんへいくけいかくがあります。', 'Từ tháng sau tôi dự định bắt đầu lớp tiếng Nhật. Cuối tuần tôi chuẩn bị. Năm sau tôi có kế hoạch đi Nhật.',
    ['Người nói bắt đầu lớp tiếng Nhật khi nào?', ['Tháng sau', 'Tuần sau', 'Năm sau'], 0, 'らいげつから nghĩa là bắt đầu từ tháng sau.'],
    ['Người nói làm gì vào cuối tuần?', ['Đi Nhật', 'Chuẩn bị', 'Bắt đầu lớp'], 1, 'しゅうまつにじゅんびをします nghĩa là chuẩn bị vào cuối tuần.']],
    { prompt: 'Viết một việc dự định làm tháng sau và kế hoạch năm tới.', hints: ['___つもりです。', '___けいかくがあります。'], sample: 'らいげつからにほんごをべんきょうするつもりです。らいねんにほんへいくけいかくがあります。' }],
  [24, 'Ôn tập tình huống giao tiếp', [
    ['電話', 'でんわ', 'điện thoại'], ['喫茶店', 'きっさてん', 'quán cà phê'], ['待ち合わせ', 'まちあわせ', 'điểm hẹn'], ['道', 'みち', 'con đường'],
    ['駅', 'えき', 'nhà ga'], ['友だち', 'ともだち', 'bạn bè'], ['時間', 'じかん', 'thời gian'], ['約束', 'やくそく', 'lời hẹn'],
  ], [
    ['Câu + から', 'から nối nguyên nhân ở vế trước với kết quả ở vế sau.', 'あめですから、でんしゃでいきます。', 'あめですから、でんしゃでいきます。', 'Vì trời mưa nên tôi đi tàu.'],
    ['そして', 'そして nối thêm một hành động hoặc sự việc theo trình tự.', 'えきであいます。そして、きっさてんへいきます。', 'えきであいます。そして、きっさてんへいきます。', 'Gặp ở ga. Sau đó đi quán cà phê.'],
  ], ['ともだちにでんわをしました。ごご二時にえきであいます。あめですから、えきからきっさてんまでバスでいきます。', 'ともだちにでんわをしました。ごごにじにえきであいます。あめですから、えきからきっさてんまでばすでいきます。', 'Tôi đã gọi điện cho bạn. Chúng tôi gặp ở ga lúc 2 giờ chiều. Vì trời mưa, chúng tôi đi xe buýt từ ga đến quán cà phê.',
    ['Họ gặp nhau lúc mấy giờ?', ['1 giờ chiều', '2 giờ chiều', '3 giờ chiều'], 1, 'ごごにじ là 2 giờ chiều.'],
    ['Vì sao họ đi xe buýt?', ['Vì trời mưa', 'Vì trễ giờ', 'Vì đường xa'], 0, 'あめですから nghĩa là vì trời mưa.']],
    { prompt: 'Viết tin nhắn hẹn bạn: giờ gặp, địa điểm và cách đi nếu trời mưa.', hints: ['___にあいましょう。', '___ですから、___でいきます。'], sample: 'ごごにじにえきであいましょう。あめですから、バスでいきます。' }],
  [25, 'Tổng ôn N5 và bài đánh giá cuối khóa', [
    ['試験', 'しけん', 'kỳ thi'], ['勉強', 'べんきょう', 'việc học'], ['復習', 'ふくしゅう', 'ôn tập'], ['単語', 'たんご', 'từ vựng'],
    ['文法', 'ぶんぽう', 'ngữ pháp'], ['読解', 'どっかい', 'đọc hiểu'], ['作文', 'さくぶん', 'bài viết'], ['合格', 'ごうかく', 'đỗ kỳ thi'],
  ], [
    ['Câu danh từ + でした / です', 'Chọn です cho hiện tại và でした cho quá khứ.', 'きのうは むずかしい しけんでした。', 'きのうは むずかしい しけんでした。', 'Hôm qua là kỳ thi khó.'],
    ['Trợ từ は / を / に / で', 'は nêu chủ đề, を đánh dấu tân ngữ, に thời điểm/nơi đến, で nơi hành động.', 'としょかんで にほんごを べんきょうします。', 'としょかんで にほんごを べんきょうします。', 'Tôi học tiếng Nhật ở thư viện.'],
  ], ['まいにちたんごとぶんぽうをふくしゅうしました。きのうのしけんはむずかしかったですが、どっかいはよくできました。らいしゅうけっかがわかります。', 'まいにちたんごとぶんぽうをふくしゅうしました。きのうのしけんはむずかしかったですが、どっかいはよくできました。らいしゅうけっかがわかります。', 'Tôi đã ôn từ vựng và ngữ pháp mỗi ngày. Kỳ thi hôm qua khó nhưng phần đọc hiểu làm khá tốt. Tuần sau sẽ biết kết quả.',
    ['Người nói ôn những gì?', ['Từ vựng và ngữ pháp', 'Chỉ phần viết', 'Nghe và nói'], 0, 'たんごとぶんぽうをふくしゅうしました nghĩa là đã ôn từ vựng và ngữ pháp.'],
    ['Người nói làm phần nào tốt?', ['Ngữ pháp', 'Đọc hiểu', 'Viết'], 1, 'どっかいはよくできました nghĩa là làm tốt phần đọc hiểu.']],
    { prompt: 'Viết kế hoạch ôn tập N5 cho một tuần, gồm từ vựng, ngữ pháp và đọc.', hints: ['まいにち___をふくしゅうします。', '___でべんきょうします。', 'しけんにごうかくしたいです。'], sample: 'まいにちたんごとぶんぽうをふくしゅうします。よるにどっかいをれんしゅうします。しけんにごうかくしたいです。' }],
];

const lessonTitles = [
  ['自己紹介', 'じこしょうかい'], ['国・仕事・言葉', 'くに・しごと・ことば'], ['教室の物', 'きょうしつのもの'],
  ['数字・年齢・電話番号', 'すうじ・ねんれい・でんわばんごう'], ['時間と毎日の予定', 'じかんとまいにちのよてい'], ['場所と道案内', 'ばしょとみちあんない'],
  ['家族と人', 'かぞくとひと'], ['食べ物と飲み物', 'たべものとのみもの'], ['買い物と値段', 'かいものとねだん'],
  ['毎日の生活', 'まいにちのせいかつ'], ['学校と仕事', 'がっこうとしごと'], ['趣味と活動', 'しゅみとかつどう'],
  ['天気と季節', 'てんきときせつ'], ['乗り物と移動', 'のりものといどう'], ['家と物の場所', 'いえともののばしょ'],
  ['形容詞', 'けいようし'], ['能力と希望', 'のうりょくときぼう'], ['誘いと約束', 'さそいとやくそく'],
  ['健康と体', 'けんこうとからだ'], ['過去と経験', 'かことけいけん'], ['規則・依頼・指示', 'きそく・いらい・しじ'],
  ['比較と選択', 'ひかくとせんたく'], ['計画と予定', 'けいかくとよてい'], ['会話のまとめ', 'かいわのまとめ'],
  ['N5総復習', 'エヌごそうふくしゅう'],
];

const additionalWords = {
  1: [['人', 'ひと', 'người'], ['国籍', 'こくせき', 'quốc tịch'], ['会社', 'かいしゃ', 'công ty'], ['大学', 'だいがく', 'đại học'], ['仕事', 'しごと', 'công việc'], ['言語', 'げんご', 'ngôn ngữ'], ['出身', 'しゅっしん', 'quê quán']],
  2: [['国籍', 'こくせき', 'quốc tịch'], ['出身', 'しゅっしん', 'quê quán'], ['大学', 'だいがく', 'đại học'], ['病院', 'びょういん', 'bệnh viện'], ['教師', 'きょうし', 'giáo viên'], ['学生', 'がくせい', 'học sinh'], ['会社', 'かいしゃ', 'công ty']],
  3: [['教科書', 'きょうかしょ', 'sách giáo khoa'], ['黒板', 'こくばん', 'bảng đen'], ['机の上', 'つくえのうえ', 'trên bàn'], ['消しゴム', 'けしごむ', 'cục tẩy'], ['万年筆', 'まんねんひつ', 'bút máy'], ['教科', 'きょうか', 'môn học'], ['窓', 'まど', 'cửa sổ']],
  4: [['一', 'いち', 'một'], ['二', 'に', 'hai'], ['三', 'さん', 'ba'], ['四', 'よん', 'bốn'], ['五', 'ご', 'năm'], ['半', 'はん', 'rưỡi'], ['月', 'がつ', 'tháng']],
  5: [['午前', 'ごぜん', 'buổi sáng'], ['午後', 'ごご', 'buổi chiều'], ['毎朝', 'まいあさ', 'mỗi sáng'], ['毎晩', 'まいばん', 'mỗi tối'], ['休み', 'やすみ', 'ngày nghỉ'], ['月曜日', 'げつようび', 'thứ Hai'], ['週末', 'しゅうまつ', 'cuối tuần']],
  6: [['前', 'まえ', 'phía trước'], ['後ろ', 'うしろ', 'phía sau'], ['隣', 'となり', 'bên cạnh'], ['近く', 'ちかく', 'gần'], ['交差点', 'こうさてん', 'ngã tư'], ['道', 'みち', 'con đường'], ['建物', 'たてもの', 'tòa nhà']],
  7: [['祖父', 'そふ', 'ông mình'], ['祖母', 'そぼ', 'bà mình'], ['姉妹', 'しまい', 'chị em gái'], ['兄弟', 'きょうだい', 'anh chị em'], ['両親', 'りょうしん', 'bố mẹ'], ['子ども', 'こども', 'trẻ em'], ['家', 'いえ', 'nhà']],
  8: [['卵', 'たまご', 'trứng'], ['牛乳', 'ぎゅうにゅう', 'sữa'], ['果物', 'くだもの', 'trái cây'], ['りんご', 'りんご', 'táo'], ['朝ご飯', 'あさごはん', 'bữa sáng'], ['昼ご飯', 'ひるごはん', 'bữa trưa'], ['晩ご飯', 'ばんごはん', 'bữa tối']],
  9: [['店員', 'てんいん', 'nhân viên cửa hàng'], ['高い', 'たかい', 'đắt, cao'], ['安い', 'やすい', 'rẻ'], ['売る', 'うる', 'bán'], ['買う', 'かう', 'mua'], ['お金', 'おかね', 'tiền'], ['品物', 'しなもの', 'món hàng']],
  10: [['働く', 'はたらく', 'làm việc'], ['休む', 'やすむ', 'nghỉ ngơi'], ['帰宅', 'きたく', 'về nhà'], ['朝食', 'ちょうしょく', 'bữa sáng'], ['夕食', 'ゆうしょく', 'bữa tối'], ['シャワー', 'しゃわー', 'vòi sen'], ['毎晩', 'まいばん', 'mỗi tối']],
  11: [['音楽', 'おんがく', 'âm nhạc'], ['映画', 'えいが', 'phim'], ['写真', 'しゃしん', 'ảnh'], ['本を読む', 'ほんをよむ', 'đọc sách'], ['歌', 'うた', 'bài hát'], ['スポーツ', 'すぽーつ', 'thể thao'], ['旅行', 'りょこう', 'du lịch']],
  12: [['予定', 'よてい', 'dự định'], ['公園', 'こうえん', 'công viên'], ['散歩', 'さんぽ', 'đi dạo'], ['映画館', 'えいがかん', 'rạp phim'], ['遊ぶ', 'あそぶ', 'chơi'], ['友人', 'ゆうじん', 'bạn bè'], ['来週', 'らいしゅう', 'tuần sau']],
  13: [['暖かい', 'あたたかい', 'ấm áp'], ['涼しい', 'すずしい', 'mát mẻ'], ['風', 'かぜ', 'gió'], ['台風', 'たいふう', 'bão'], ['雲', 'くも', 'mây'], ['気温', 'きおん', 'nhiệt độ'], ['天気予報', 'てんきよほう', 'dự báo thời tiết']],
  14: [['新幹線', 'しんかんせん', 'tàu shinkansen'], ['乗る', 'のる', 'lên xe'], ['降りる', 'おりる', 'xuống xe'], ['乗り換え', 'のりかえ', 'chuyển tàu'], ['片道', 'かたみち', 'vé một chiều'], ['往復', 'おうふく', 'khứ hồi'], ['運転手', 'うんてんしゅ', 'tài xế']],
  15: [['宿題', 'しゅくだい', 'bài tập về nhà'], ['試験', 'しけん', 'kỳ thi'], ['教室', 'きょうしつ', 'phòng học'], ['図書館', 'としょかん', 'thư viện'], ['質問', 'しつもん', 'câu hỏi'], ['答え', 'こたえ', 'câu trả lời'], ['練習', 'れんしゅう', 'luyện tập']],
  16: [['頭', 'あたま', 'đầu'], ['手', 'て', 'tay'], ['足', 'あし', 'chân'], ['目', 'め', 'mắt'], ['痛い', 'いたい', 'đau'], ['熱', 'ねつ', 'sốt'], ['薬', 'くすり', 'thuốc']],
  17: [['昼休み', 'ひるやすみ', 'giờ nghỉ trưa'], ['朝ご飯', 'あさごはん', 'bữa sáng'], ['夕方', 'ゆうがた', 'chiều tối'], ['夜中', 'よなか', 'nửa đêm'], ['起きる', 'おきる', 'thức dậy'], ['寝る', 'ねる', 'ngủ'], ['忙しい', 'いそがしい', 'bận rộn']],
  18: [['入口', 'いりぐち', 'lối vào'], ['出口', 'でぐち', 'lối ra'], ['角', 'かど', 'góc đường'], ['信号', 'しんごう', 'đèn giao thông'], ['橋', 'はし', 'cây cầu'], ['公園', 'こうえん', 'công viên'], ['近所', 'きんじょ', 'khu phố']],
  19: [['空港', 'くうこう', 'sân bay'], ['飛行機', 'ひこうき', 'máy bay'], ['ホテル', 'ほてる', 'khách sạn'], ['地図', 'ちず', 'bản đồ'], ['写真', 'しゃしん', 'ảnh'], ['お土産', 'おみやげ', 'quà lưu niệm'], ['旅行者', 'りょこうしゃ', 'du khách']],
  20: [['会議', 'かいぎ', 'cuộc họp'], ['資料', 'しりょう', 'tài liệu'], ['始める', 'はじめる', 'bắt đầu'], ['終わる', 'おわる', 'kết thúc'], ['同僚', 'どうりょう', 'đồng nghiệp'], ['忙しい', 'いそがしい', 'bận rộn'], ['予定表', 'よていひょう', 'thời gian biểu']],
  21: [['必要', 'ひつよう', 'cần thiết'], ['傘', 'かさ', 'ô, dù'], ['鍵', 'かぎ', 'chìa khóa'], ['財布', 'さいふ', 'ví tiền'], ['地図', 'ちず', 'bản đồ'], ['持つ', 'もつ', 'mang theo'], ['忘れる', 'わすれる', 'quên']],
  22: [['毎週', 'まいしゅう', 'mỗi tuần'], ['習慣', 'しゅうかん', 'thói quen'], ['掃除', 'そうじ', 'dọn dẹp'], ['洗濯', 'せんたく', 'giặt giũ'], ['料理', 'りょうり', 'nấu ăn'], ['手伝う', 'てつだう', 'giúp đỡ'], ['家事', 'かじ', 'việc nhà']],
  23: [['将来', 'しょうらい', 'tương lai'], ['明後日', 'あさって', 'ngày kia'], ['再来週', 'さらいしゅう', 'tuần sau nữa'], ['毎年', 'まいとし', 'mỗi năm'], ['続ける', 'つづける', 'tiếp tục'], ['目標', 'もくひょう', 'mục tiêu'], ['夢', 'ゆめ', 'ước mơ']],
  24: [['会う', 'あう', 'gặp'], ['遅れる', 'おくれる', 'đến muộn'], ['場所', 'ばしょ', 'địa điểm'], ['知らせる', 'しらせる', 'báo cho biết'], ['都合', 'つごう', 'sự thuận tiện'], ['返事', 'へんじ', 'câu trả lời'], ['メッセージ', 'めっせーじ', 'tin nhắn']],
  25: [['正解', 'せいかい', 'đáp án đúng'], ['結果', 'けっか', 'kết quả'], ['漢字', 'かんじ', 'chữ Hán'], ['聴解', 'ちょうかい', 'nghe hiểu'], ['問題', 'もんだい', 'câu hỏi, vấn đề'], ['努力', 'どりょく', 'nỗ lực'], ['集中', 'しゅうちゅう', 'sự tập trung']],
};

export const LESSONS = seeds.map(makeLesson);
