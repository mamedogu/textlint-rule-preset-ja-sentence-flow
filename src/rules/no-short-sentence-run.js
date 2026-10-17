"use strict";
const { isInside, getSentences, countChars, hasTerminalPunctuation, validateOptions } = require("../util");

const DEFAULT_OPTIONS = {
  maxLength: 20, // この文字数以下の文を「短い文」とみなす
  minCount: 3, // 短い文がこの数以上続いたら指摘する
  // true にすると、続けて置かれた段落どうしも、つながった並びとして数える。
  // 既定は false（1つの段落の中だけで数える。段落・見出し・箇条書き・表をまたがない）
  acrossParagraphs: false,
};

function reporter(context, options = {}) {
  const { Syntax, RuleError, report, locator } = context;
  const opts = validateOptions("no-short-sentence-run", { ...DEFAULT_OPTIONS, ...options }, {
    maxLength: "number>=0",
    minCount: "int>=1",
    acrossParagraphs: "boolean",
  });
  let run = []; // { paragraph, sentence }
  let lastParagraph = null;

  const flush = () => {
    if (run.length >= opts.minCount) {
      const first = run[0];
      const sameParagraph = run.filter((r) => r.paragraph === first.paragraph);
      const last = sameParagraph[sameParagraph.length - 1];
      report(
        first.paragraph,
        new RuleError(
          `${opts.maxLength}文字以下の短い文が${run.length}個続いています。文をつなぐか、理由や条件を足せないか確かめてください。`,
          { padding: locator.range([first.sentence.start, last.sentence.end]) }
        )
      );
    }
    run = [];
  };

  return {
    [Syntax.Paragraph](node) {
      if (isInside(node, [Syntax.BlockQuote, Syntax.ListItem, Syntax.Table])) return;
      const parent = node.parent;
      const adjacent =
        opts.acrossParagraphs &&
        lastParagraph &&
        parent &&
        lastParagraph.parent === parent &&
        parent.children.indexOf(lastParagraph) === parent.children.indexOf(node) - 1;
      if (!adjacent) flush();
      lastParagraph = node;
      for (const sentence of getSentences(node)) {
        const isShort = hasTerminalPunctuation(sentence.text) && countChars(sentence.text) <= opts.maxLength;
        if (isShort) {
          run.push({ paragraph: node, sentence });
        } else {
          flush();
        }
      }
      if (!opts.acrossParagraphs) flush();
    },
    [`${Syntax.Document}:exit`]() {
      flush();
    },
  };
}

module.exports = reporter;
