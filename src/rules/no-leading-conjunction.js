"use strict";
const { isInside, getSentences, validateOptions } = require("../util");

const DEFAULT_OPTIONS = {
  words: ["一方で", "その一方で", "ただし", "とはいえ"], // 文頭で指摘する語
  requireComma: true, // 語のすぐ後に読点（、，,）がある場合だけ指摘する
};

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function reporter(context, options = {}) {
  const { Syntax, RuleError, report, locator } = context;
  const opts = validateOptions("no-leading-conjunction", { ...DEFAULT_OPTIONS, ...options }, {
    words: "strings",
    requireComma: "boolean",
  });
  // 長い語から先に試す（「その一方で」を「一方で」より先に）
  const words = [...opts.words].sort((a, b) => b.length - a.length);
  if (words.length === 0) return {};
  const tail = opts.requireComma ? "(?=[、，,])" : "";
  const re = new RegExp(`^(\\s*)(${words.map(escape).join("|")})${tail}`, "u");
  return {
    [Syntax.Paragraph](node) {
      if (isInside(node, [Syntax.BlockQuote, Syntax.Table])) return;
      for (const sentence of getSentences(node)) {
        const m = re.exec(sentence.text);
        if (!m) continue;
        const start = sentence.start + m[1].length;
        report(
          node,
          new RuleError(`文が「${m[2]}」で始まっています。前の文とのつながりを、語に頼らずに書けないか確かめてください。`, {
            padding: locator.range([start, start + m[2].length]),
          })
        );
      }
    },
  };
}

module.exports = reporter;
