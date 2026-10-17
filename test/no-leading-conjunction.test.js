"use strict";
const TextLintTester = require("./_setup");
const rule = require("../src/rules/no-leading-conjunction");
const tester = new TextLintTester();

tester.run("no-leading-conjunction", rule, {
  valid: [
    "読み込みは速くなったが、書き込みは変わらなかった。",
    "ただし書きの条件を読み落としていた。",
    "一方向の同期だけを使う。",
    "# 一方で、書き込みは遅い",
    "> 一方で、書き込みは遅いままだった。",
    "```\nただし、この行はコードの中。\n```",
    { text: "しかし、書き込みは遅いままだった。" },
    { text: "一方で、書き込みは遅いままだった。", options: { words: ["しかし"] } },
  ],
  invalid: [
    {
      text: "一方で、書き込みは遅いままだった。",
      errors: [{ message: "文が「一方で」で始まっています。前の文とのつながりを、語に頼らずに書けないか確かめてください。", range: [0, 3] }],
    },
    { text: "読み込みは速くなった。ただし、書き込みは変わらない。", errors: [{ range: [11, 14] }] },
    { text: "その一方で、書き込みは遅い。", errors: [{ message: "文が「その一方で」で始まっています。前の文とのつながりを、語に頼らずに書けないか確かめてください。" }] },
    { text: "- とはいえ、全部を直す時間はない。", errors: [{ range: [2, 6] }] },
    { text: "しかし、書き込みは遅い。", options: { words: ["しかし"] }, errors: [{ range: [0, 3] }] },
    { text: "ただし書き込みは遅い。", options: { requireComma: false }, errors: [{ range: [0, 3] }] },
  ],
});

// 配列の設定に文字列を1つ渡したときは、その文字列1つの配列として扱う（1文字ずつに分けない）
tester.run("no-leading-conjunction（文字列の設定）", rule, {
  valid: [{ text: "一つ目の設定を読む。", options: { words: "一方で" } }],
  invalid: [{ text: "一方で、書き込みは遅い。", options: { words: "一方で" }, errors: [{ range: [0, 3] }] }],
});
