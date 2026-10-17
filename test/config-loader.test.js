"use strict";
// 利用者の .textlintrc と同じ形の設定を、textlint の設定の読み込み（@textlint/config-loader）に通して、
// 4つ目の規則（number-needs-base）がオンになるかを確かめる。規則集は test/fixtures/ に利用者の環境と同じ名前で置いている。
const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { loadPackagesFromRawConfig } = require("@textlint/config-loader");

const load = async (presetConfig) => {
  const result = await loadPackagesFromRawConfig({
    rawConfig: { rules: { "preset-ja-sentence-flow": presetConfig } },
    node_moduleDir: path.join(__dirname, "fixtures"),
  });
  assert.ok(result.ok, JSON.stringify(result.error));
  const rule = result.config.rules.find((r) => r.ruleId.endsWith("/number-needs-base"));
  assert.ok(rule, "number-needs-base が読み込まれていない");
  return rule.options;
};

describe("設定の読み込みを通した number-needs-base のオン・オフ", () => {
  it("規則集を true で使うと、number-needs-base はオフ", async () => {
    assert.strictEqual(await load(true), false);
  });
  it("number-needs-base を書かなければオフ", async () => {
    assert.strictEqual(await load({ "no-preview-sentence": true }), false);
  });
  it("number-needs-base に {} を書くとオン", async () => {
    assert.deepStrictEqual(await load({ "number-needs-base": {} }), {});
  });
  it("number-needs-base に設定の項目を書くとオン", async () => {
    assert.deepStrictEqual(await load({ "number-needs-base": { countUnits: ["件"] } }), { countUnits: ["件"] });
  });
  it("number-needs-base に false を書くとオフ", async () => {
    assert.strictEqual(await load({ "number-needs-base": false }), false);
  });
  // textlint 15.8.0 の設定の読み込みの制約：getRuleOptions は、利用者の値が true のときと書かれていないときに、
  // どちらも規則集の rulesConfig の値を返す。規則集の側からは2つを見分けられないため、
  // 既定でオフのまま true でオンにすることは、規則集のコードでは実現できていない（未解決。todo として残す）
  it("number-needs-base に true を書くとオン", { todo: "textlint 15.8.0 の設定の読み込みでは実現できない（getRuleOptions の制約、未解決）" }, async () => {
    assert.notStrictEqual(await load({ "number-needs-base": true }), false);
  });
});
