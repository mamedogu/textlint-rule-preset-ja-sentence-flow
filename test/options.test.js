"use strict";
// 設定の検証：不正な値は、規則名と設定名の入った文言のエラーになる。
const { describe, it } = require("node:test");
const assert = require("node:assert");
const preset = require("../src/index");

const context = {
  Syntax: { Paragraph: "Paragraph", Document: "Document", BlockQuote: "BlockQuote", Table: "Table", ListItem: "ListItem" },
  RuleError: class {},
  report() {},
  locator: { range: (r) => r },
};
const run = (name, options) => preset.rules[name](context, options);

describe("設定の検証", () => {
  const bad = [
    ["no-short-sentence-run", { minCount: 0 }, /no-short-sentence-run.*minCount/],
    ["no-short-sentence-run", { minCount: -1 }, /minCount/],
    ["no-short-sentence-run", { minCount: 2.5 }, /minCount/],
    ["no-short-sentence-run", { maxLength: "abc" }, /maxLength/],
    ["no-short-sentence-run", { maxLength: -1 }, /maxLength/],
    ["no-short-sentence-run", { acrossParagraphs: "yes" }, /acrossParagraphs/],
    ["no-leading-conjunction", { words: null }, /no-leading-conjunction.*words/],
    ["no-leading-conjunction", { words: [1] }, /words/],
    ["no-preview-sentence", { extraPatterns: ["("] }, /extraPatterns の正規表現「\(」/],
    ["no-preview-sentence", { allowPatterns: ["[a"] }, /allowPatterns の正規表現「\[a」/],
    ["number-needs-base", { baseHints: null }, /number-needs-base.*baseHints/],
    ["number-needs-base", { periodPatterns: ["(?<"] }, /periodPatterns/],
  ];
  for (const [name, options, re] of bad) {
    it(`${name} ${JSON.stringify(options)} は分かる文言で止まる`, () => {
      assert.throws(() => run(name, options), re);
    });
  }
  it("正しい値では止まらない", () => {
    for (const name of Object.keys(preset.rules)) assert.doesNotThrow(() => run(name, {}));
  });
  it("number-needs-base は既定でオフ、ほかの3つはオン", () => {
    assert.deepStrictEqual(preset.rulesConfig, {
      "no-short-sentence-run": true,
      "no-preview-sentence": true,
      "no-leading-conjunction": true,
      "number-needs-base": false,
    });
  });
});
