"use strict";
const { StringSource } = require("textlint-util-to-string");
const { split } = require("sentence-splitter");

// 引用の中の段落は、他人の文なので調べない。
function isInside(node, types) {
  let cur = node.parent;
  while (cur) {
    if (types.includes(cur.type)) return true;
    cur = cur.parent;
  }
  return false;
}

// 段落を素の文字列にして文に分け、各文の文字列と段落の中での位置を返す。
// toOriginal(i) は、文の中の i 文字目（素の文字列での位置）を段落の中の元の位置に戻す。
function getSentences(paragraph) {
  const source = new StringSource(paragraph);
  const text = source.toString();
  const result = [];
  for (const node of split(text)) {
    if (node.type !== "Sentence") continue;
    const start = source.originalIndexFromIndex(node.range[0]);
    const end = source.originalIndexFromIndex(node.range[1], true);
    if (start === undefined || end === undefined) continue;
    const base = node.range[0];
    result.push({
      text: node.raw,
      start,
      end,
      toOriginal: (i, isEnd = false) => source.originalIndexFromIndex(base + i, isEnd),
    });
  }
  return result;
}

// 文字数。サロゲートペアを1文字と数え、空白と文末の記号は数えない。
function countChars(text) {
  const body = text.replace(/\s+/g, "").replace(/[。．.!?！？]+$/u, "");
  return Array.from(body).length;
}

function hasTerminalPunctuation(text) {
  return /[。．!?！？]\s*$/u.test(text);
}

// 設定の検証。不正な値は、規則名と設定名の入った文言のエラーにする（既定値に戻して進めることはしない）。
// 配列の設定に文字列を1つ渡した場合だけは、その文字列1つの配列として扱う。
function fail(rule, name, expected, value) {
  let shown;
  try {
    shown = JSON.stringify(value);
  } catch {
    shown = String(value);
  }
  throw new Error(`[preset-ja-sentence-flow/${rule}] 設定 ${name} は${expected}にしてください（受け取った値: ${shown}）`);
}

function validateOptions(rule, opts, spec) {
  const out = { ...opts };
  for (const [name, kind] of Object.entries(spec)) {
    const v = out[name];
    if (kind === "int>=1") {
      if (!Number.isInteger(v) || v < 1) fail(rule, name, "1以上の整数", v);
    } else if (kind === "number>=0") {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) fail(rule, name, "0以上の数", v);
    } else if (kind === "boolean") {
      if (typeof v !== "boolean") fail(rule, name, " true か false", v);
    } else if (kind === "strings") {
      const arr = typeof v === "string" ? [v] : v;
      if (!Array.isArray(arr) || !arr.every((s) => typeof s === "string" && s.length > 0)) {
        fail(rule, name, "空でない文字列の配列", v);
      }
      out[name] = arr;
    }
  }
  return out;
}

// 正規表現の文字列を組み立てる。書き方が誤っていれば、どの設定のどの文字列かを文言に入れる。
function compileRegex(rule, name, pattern, flags = "u") {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`[preset-ja-sentence-flow/${rule}] 設定 ${name} の正規表現「${pattern}」を読めません: ${e.message}`);
  }
}

module.exports = { isInside, getSentences, countChars, hasTerminalPunctuation, validateOptions, compileRegex };
