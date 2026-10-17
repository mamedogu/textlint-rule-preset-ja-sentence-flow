"use strict";
const TextLintTester = require("./_setup");
const rule = require("../src/rules/no-short-sentence-run");
const tester = new TextLintTester();

tester.run("no-short-sentence-run", rule, {
  valid: [
    "ビルドが遅い原因を調べたところ、依存パッケージの数が増えてキャッシュが効かなくなっていた。",
    "遅い。原因はキャッシュの設定で、古いエントリが残ったまま毎回作り直されていたことだった。消すと速くなった。",
    "# 結果\n\n速くなった。\n\n- 遅い。\n- 直した。\n- 速い。",
    "```\n遅い。直した。速い。\n```",
    "> 遅い。直した。速い。",
    {
      text: "遅い。直した。速い。",
      options: { minCount: 4 },
    },
    {
      text: "遅い。直した。\n\n速い。",
      options: { acrossParagraphs: false },
    },
    // 既定では段落をまたいで数えない
    "遅い。直した。\n\n速い。",
    "「禁止事項」は v1 のまま。v1 は残す。\n\n設定を足した。テストも足した。",
    "結論から書く。\n\n遅い。\n\n原因はキャッシュだ。",
    "遅い。直した。\n\n# 結果\n\n速い。",
    "遅い。直した。\n\n- 速い。",
  ],
  invalid: [
    {
      text: "「禁止事項」は v1 のまま。v1 は残す。\n\n設定を足した。テストも足した。",
      options: { acrossParagraphs: true },
      errors: [{ line: 1 }],
    },
    {
      text: "遅い。直した。速い。",
      errors: [{ message: "20文字以下の短い文が3個続いています。文をつなぐか、理由や条件を足せないか確かめてください。", range: [0, 10] }],
    },
    {
      text: "ログを見た。エラーが出ていた。設定を直した。動いた。",
      errors: [{ range: [0, 26] }],
    },
    {
      text: "サーバーのメモリ使用量が夜間に増え続ける問題を、まず監視の設定から順に調べることにした。原因は分かった。ログが多すぎた。保存期間を縮めた。",
      errors: [{ line: 1 }],
    },
    {
      text: "結論から書く。\n\n遅い。\n\n原因はキャッシュだ。",
      options: { acrossParagraphs: true },
      errors: [{ line: 1, column: 1 }],
    },
    {
      text: "手順は少ない。入れる。設定する。動かす。",
      options: { maxLength: 5, minCount: 3 },
      errors: [{ range: [7, 20] }],
    },
  ],
});
