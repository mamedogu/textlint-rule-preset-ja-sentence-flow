"use strict";
const { isInside, getSentences, validateOptions, compileRegex } = require("../util");

// 予告の文の形。いずれも「ます」「ましょう」で終わる、これから書くことを告げる言い方に限る。
// 説明の動詞は「て」の直前までの形で書く（「確認し」「追っ」）。動詞のすぐ後は「ていき」「ておき」「てみ」に
// 限るので、「積み上げ」「楽しみ」「追加」には合わない。1文字の「見」「み」は、直前が漢字でないときだけ
// 動詞とみなす（「意見」「下見」「試み」に合わせない。「続いてみていきます」「改めてみていきましょう」は拾う）。
const VERB =
  "(?:確認し|紹介し|説明し|解説し|整理し|比較し|検証し|分析し|まとめ|振り返っ|掘り下げ|触れ|取り上げ|考え|扱っ|追っ|眺め" +
  "|(?<![\\p{Script=Han}])見|(?<![\\p{Script=Han}])み)";
// 先を指す語。
// - 「以下」「下記」は「以下で」「以下では」「以下に」「以下の」の形（「以下に説明します」「以下の手順で説明します」）。
//   直前が数字・漢字・カタカナ・英字・%・ー・空白・/・「れ」のとき（「10以下の値」「10件以下」「基準値以下」
//   「バージョン以下」「10 以下」「docs/以下」「それ以下」）は範囲や順位の「以下」なので外す。
//   「以下のように書きます」は、「書き」を先を指す語のすぐ後に限っている（下の5つ目の形）ので拾わない
// - 「後で」「後半」は直前が漢字のとき（午後で、前後半）を外す。ただし「記事後半」「本稿後半」「連載後半」
//   「本書後半」「章後半」「節後半」は先を指す語として拾う。「後ほど」は直前を見ない。「あとで」は直前が
//   「た」「だ」のとき（終えたあとで）を外す
const AHEAD =
  "(?:(?:次の(?:章|節|項|記事|回)|次章|次節|次回|別の記事|別記事|(?:記事|本稿|本書|連載|章|節)後半|後ほど|(?<![\\p{Script=Han}])(?:後半|後で)|(?<![ただ])あとで|このあと|この後)(?:で|では|に)?" +
  "|(?<![0-9０-９A-Za-zＡ-Ｚａ-ｚ%％ー\\s/／れ\\p{Script=Han}\\p{Script=Katakana}])(?:以下|下記)(?:で|では|に|の))";
const DEFAULT_PATTERNS = [
  // 次に〜を見ていきます、手順を確認していきましょう
  `${VERB}ていき(?:ます|ましょう)`,
  // 〜を確認しておきます、整理しておきましょう
  `${VERB}ておき(?:ます|ましょう)`,
  // 〜を見てみましょう、整理してみます（文末に限る）
  `${VERB}てみ(?:ます|ましょう)[。！!]?$`,
  // 次の節で扱います、後ほど説明します、以下で紹介します。「〜として扱います」は分類の言い方なので外す
  // （「以下の場合は例外として扱います」「年収が以下の金額なら非課税として扱います」）
  `${AHEAD}[^。]{0,20}?(?:(?<!として)扱|取り上げ|触れ|説明し|解説し|紹介し|述べ)(?:い|り|れ|ま)?(?:ます|ましょう)`,
  // 「書き」「見」は、先を指す語のすぐ後（間に読点か「詳しく」程度）に限る：次の節で詳しく見ます、以下で書きます
  `${AHEAD}[、，,]?(?:詳しく|改めて|もう少し)?(?:書き|見)(?:ます|ましょう)`,
  // 本記事では〜を説明します、ここでは〜を紹介します
  `^(?:本記事|この記事|本稿|本章|本節|この章|この節|ここ|今回)(?:では|は)[^。]{0,40}?(?:扱|取り上げ|触れ|説明し|解説し|紹介し|述べ|見てい)(?:い|り|れ|き)?(?:ます|ましょう)`,
];

const DEFAULT_OPTIONS = {
  extraPatterns: [], // 足したい正規表現（文字列）
  allowPatterns: [], // この正規表現に合う文は指摘しない（文字列）
  ignoreQuoted: true, // 「」『』の中は、言い方の例として引いたものとみなして調べない
};

function reporter(context, options = {}) {
  const { Syntax, RuleError, report, locator } = context;
  const name = "no-preview-sentence";
  const opts = validateOptions(name, { ...DEFAULT_OPTIONS, ...options }, {
    extraPatterns: "strings",
    allowPatterns: "strings",
    ignoreQuoted: "boolean",
  });
  const patterns = [
    ...DEFAULT_PATTERNS.map((p) => new RegExp(p, "u")),
    ...opts.extraPatterns.map((p) => compileRegex(name, "extraPatterns", p)),
  ];
  const allows = opts.allowPatterns.map((p) => compileRegex(name, "allowPatterns", p));
  return {
    [Syntax.Paragraph](node) {
      if (isInside(node, [Syntax.BlockQuote, Syntax.Table])) return;
      for (const sentence of getSentences(node)) {
        let text = sentence.text.trim();
        if (opts.ignoreQuoted) text = text.replace(/「[^「」]*」|『[^『』]*』/gu, "「」");
        if (allows.some((re) => re.test(text))) continue;
        if (!patterns.some((re) => re.test(text))) continue;
        report(
          node,
          new RuleError("このあと書くことを予告する文に見えます。予告をやめて、中身から書けないか確かめてください。", {
            padding: locator.range([sentence.start, sentence.end]),
          })
        );
      }
    },
  };
}

module.exports = reporter;
