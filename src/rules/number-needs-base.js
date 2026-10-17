"use strict";
const { isInside, getSentences, validateOptions, compileRegex } = require("../util");

const RULE = "number-needs-base";
const NUM = "(?<![0-9０-９.．,，A-Za-z第v])[0-9０-９][0-9０-９,，]*(?:[.．][0-9０-９]+)?";

const DEFAULT_OPTIONS = {
  // 件数とみなす単位。「回」「個」は手順の説明で多く使うので既定では入れない
  countUnits: ["件", "人", "名", "社", "票", "ダウンロード", "ユーザー", "回答", "倍"],
  // 母数があるとみなす手がかり。「/」「／」は前後が両方数字のとき（日付や 10/11）は数えない。
  // 「うち」は直前が「の」以外のひらがなのとき（おうち、そのうち）は数えない
  baseHints: ["のうち", "うち", "中", "母数", "全体", "対象", "分の", "/", "／", "n=", "N=", "n＝", "N＝"],
  // 期間があるとみなす手がかり（正規表現の文字列）
  periodPatterns: [
    "[0-9０-９]{4}[年/／-]",
    "[0-9０-９]{1,2}\\s*月",
    "[0-9０-９]+\\s*(?:日|週|か月|ヶ月|カ月|年)",
    "[0-9０-９]{1,2}[/／][0-9０-９]{1,2}",
    "(?:期間|時点|現在|直近|過去|今月|先月|来月|今年|昨年|去年|毎年|今週|先週|毎月|毎週|毎日|月間|年間|週間|日間)",
    "(?:^|[^ぁ-ん])(?:月|年|週|日)(?:に|あたり|当たり|ごと)?[0-9０-９]",
    "(?:月|年|週|日)(?:あたり|当たり|ごと)",
    "[〜～]",
  ],
};

// 統計でない数とみなして指摘しない形
// 数の直後：しきい値・上限（1,000人を超える、40人まで、10件以上）
const THRESHOLD_AFTER = /^\s*(?:を超え|を越え|超|まで|以上|以下|未満|以内|を上限|より多|より少)/u;
// 「1人1つ」「1人1アカウント」のような割り当ての定義
const PER_UNIT_AFTER = /^[0-9０-９一]/u;
const PER_UNITS = ["人", "名", "社"];
// 1件だけ、1件ずつ、もう1件：数の説明ではなく動作の説明
const SINGLE_AFTER = /^(?:だけ|ずつ|ごと|につき|あたり)/u;
const SINGLE_BEFORE = /(?:もう|あと)\s*$/u;
// 率：同じ文に手数料・税率などの語があれば、%・割は率とみなす
const RATE_WORDS = /(?:手数料|税率|消費税|割引|料率|利率|金利|還元率|報酬率|fee|tax|commission|discount)/iu;

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hintRegex(hint) {
  if (hint === "/" || hint === "／") {
    // 前後が両方数字のもの（10/11）は母数とみなさない
    return new RegExp(`(?<![0-9０-９])${escape(hint)}|${escape(hint)}(?![0-9０-９])`, "u");
  }
  if (hint === "うち") return /(?<![ぁ-ねは-ん])うち/u;
  return new RegExp(escape(hint), "u");
}

function isNonStatistical(text, m, unit) {
  const after = text.slice(m.index + m[0].length);
  const before = text.slice(0, m.index);
  const isOne = /^[1１]$/u.test(m.groups.num);
  if (THRESHOLD_AFTER.test(after)) return true;
  if (PER_UNITS.includes(unit) && PER_UNIT_AFTER.test(after)) return true;
  if (isOne && (SINGLE_AFTER.test(after) || SINGLE_BEFORE.test(before))) return true;
  if (/^(?:%|％|パーセント|割)$/u.test(unit) && RATE_WORDS.test(text)) return true;
  return false;
}

function reporter(context, options = {}) {
  const { Syntax, RuleError, report, locator } = context;
  const opts = validateOptions(RULE, { ...DEFAULT_OPTIONS, ...options }, {
    countUnits: "strings",
    baseHints: "strings",
    periodPatterns: "strings",
  });
  const units = [...opts.countUnits].sort((a, b) => b.length - a.length).map(escape);
  const unitAlt = units.length ? `|(?:${units.join("|")})(?!目)` : "";
  // 単位の後に「目」が続くもの（3件目）は順番なので除く
  const numberRe = new RegExp(
    `(?<num>${NUM})\\s*(?<unit>%|％|パーセント|割(?![りに引])${unitAlt})`,
    "gu"
  );
  const periodRes = opts.periodPatterns.map((p) => compileRegex(RULE, "periodPatterns", p));
  const baseRes = opts.baseHints.map(hintRegex);
  return {
    [Syntax.Paragraph](node) {
      if (isInside(node, [Syntax.BlockQuote, Syntax.Table])) return;
      for (const sentence of getSentences(node)) {
        const text = sentence.text;
        let m;
        numberRe.lastIndex = 0;
        let found = null;
        while ((m = numberRe.exec(text))) {
          if (!isNonStatistical(text, m, m.groups.unit)) {
            found = m;
            break;
          }
        }
        if (!found) continue;
        const hasBase = baseRes.some((re) => re.test(text));
        const hasPeriod = periodRes.some((re) => re.test(text));
        if (hasBase && hasPeriod) continue;
        const missing = !hasBase && !hasPeriod ? "母数と期間" : !hasBase ? "母数" : "期間";
        // 素の文字列での位置を、元の文書の位置に戻す（数字の前にリンクなどの記法があってもずれない）
        let start = sentence.toOriginal(found.index);
        let end = sentence.toOriginal(found.index + found[0].length, true);
        if (start === undefined || end === undefined) {
          start = sentence.start;
          end = sentence.end;
        }
        report(
          node,
          new RuleError(`「${found[0]}」の${missing}が同じ文に見当たりません。母数と期間を確かめてください。`, {
            padding: locator.range([start, end]),
          })
        );
      }
    },
  };
}

module.exports = reporter;
