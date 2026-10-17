# textlint-rule-preset-ja-sentence-flow

日本語の文章の流れについて、3つの決まりを指摘する textlint の規則集です。4つ目の規則（number-needs-base）は試験中で、既定では動きません。

@textlint-ja/textlint-rule-preset-ai-writing や textlint-rule-preset-ja-technical-writing と並べて使うことを前提にしていて、この規則集だけでは誇張語や長すぎる文は見ません。3つの決まりは、並べて使う規則集が見ていないと考えたものを選びましたが、指摘が重ならないかはまだ確かめていません。

| 規則 | 指摘すること | 既定 |
|---|---|---|
| no-short-sentence-run | 短い文（20文字以下）が3つ以上続いている | 有効 |
| no-preview-sentence | 「このあと何を書くか」を予告する文 | 有効 |
| no-leading-conjunction | 「一方で、」「ただし、」などで始まる文 | 有効 |
| number-needs-base | 母数や期間のない数字（試験中） | 無効 |

3つの決まりの要点は次のとおりです。

1. 短い文（空白と文末の句点を除いて20文字以下の文）を3つ以上続けない。続けると箇条書きを文にしただけに見えるので、文をつなぐか、理由や条件を足す
2. 「次に〜を見ていきます」「この記事では〜を説明します」のような予告を書かず、中身から書く
3. 「一方で、」「ただし、」で文を始めず、前の文とどうつながるかを文の中身で示す。つながりを語に任せない

どの規則も文字の並びだけで判定しているので、文の意味は分かりません。指摘は「直すべき箇所」ではなく「読み直す候補」として扱ってください。

## 入れ方

npm には公開していません。GitHub から直接入れます。textlint 15 系と Node.js 20 以上が要ります（0.4.0 のテストは textlint 15.8.0 と Node.js 24 で流しました）。

```sh
npm install --save-dev textlint@15 github:mamedogu/textlint-rule-preset-ja-sentence-flow
```

## .textlintrc の例

既存の規則集と並べる場合は次のように書きます。

```json
{
  "rules": {
    "preset-ja-technical-writing": true,
    "@textlint-ja/preset-ai-writing": true,
    "preset-ja-sentence-flow": {
      "no-short-sentence-run": { "maxLength": 20, "minCount": 3 },
      "no-leading-conjunction": { "words": ["一方で", "その一方で", "ただし", "とはいえ"] }
    }
  }
}
```

この規則集だけを使うなら `"preset-ja-sentence-flow": true` で足ります。

no-short-sentence-run、no-preview-sentence、no-leading-conjunction の3つは既定でオンです。規則を1つだけ止めたいときは、その規則に `false` を書きます。

試験中の number-needs-base を使うときは、`true` ではなく `{}`（または設定の項目を書いたもの）を書いてください。textlint 15.8.0 では、規則集の中で既定がオフの規則に `true` を書いても、オンになりません（後の「まだ合わない例」を参照）。

```json
{
  "rules": {
    "preset-ja-sentence-flow": {
      "number-needs-base": {}
    }
  }
}
```

規則のファイルが入ったフォルダを `--rulesdir` で渡す使い方もできますが、この使い方ではフォルダの中の4つの規則がすべて動き、試験中の number-needs-base も指摘を出します。既定で無効になるのは、上のように .textlintrc で規則集（preset-ja-sentence-flow）として使ったときだけです。

```sh
# 4つの規則がすべて動く（number-needs-base も含む）
npx textlint --rulesdir node_modules/textlint-rule-preset-ja-sentence-flow/src/rules README.md
```

## 設定の項目

| 規則 | 項目 | 既定値 | 意味 |
|---|---|---|---|
| no-short-sentence-run | maxLength | 20 | この文字数以下の文を短い文とみなす（空白と文末の記号は数えない） |
| | minCount | 3 | 短い文がこの数以上続いたら指摘する |
| | acrossParagraphs | false | true にすると、隣り合う段落どうしも続いた並びとして数える。既定では1つの段落の中だけで数え、段落・見出し・箇条書き・表をまたがない |
| no-preview-sentence | extraPatterns | [] | 予告とみなす正規表現を足す |
| | allowPatterns | [] | この正規表現に合う文は指摘しない |
| | ignoreQuoted | true | 「」『』の中を調べない |
| no-leading-conjunction | words | 一方で、その一方で、ただし、とはいえ | 文頭で指摘する語 |
| | requireComma | true | 語の直後に読点があるときだけ指摘する |

number-needs-base の設定の項目（countUnits、baseHints、periodPatterns）は試験中で変わる見込みがあるため、ここには載せていません。中身は src/rules/number-needs-base.js の既定値を見てください。

### 設定の値が正しくないとき

設定の値の型や範囲が正しくないと、規則名と設定名と受け取った値を入れた文言のエラーで textlint が止まります（既定値に戻して黙って進めることはしません）。確かめる内容は次のとおりです。

- minCount は1以上の整数、maxLength は0以上の数、acrossParagraphs・requireComma・ignoreQuoted は true か false
- words、extraPatterns、allowPatterns は空でない文字列の配列。文字列を1つだけ渡した場合は、その文字列1つの配列として扱います（1文字ずつには分けません）
- extraPatterns、allowPatterns の正規表現が読めないときは、どの設定のどの文字列かをエラーの文言に入れます

```text
[preset-ja-sentence-flow/no-short-sentence-run] 設定 minCount は1以上の整数にしてください（受け取った値: 0）
```

extraPatterns、allowPatterns に書いた正規表現の速さ（文によって極端に遅くなる書き方をしないこと）は、利用者の責任です。

## 規則ごとの指摘の例

no-short-sentence-run は、20文字以下の文が3つ以上続く次のような段落を指摘します。

```text
ログを見た。エラーが出ていた。設定を直した。動いた。
→ 20文字以下の短い文が4個続いています。文をつなぐか、理由や条件を足せないか確かめてください。
```

no-preview-sentence は、「見ていきます」「確認しておきます」「次の節で扱います」「この記事では〜を説明します」のような形を拾います。過去形の「見てきました」は拾いません。「積み上げていきます」「追加しておきます」「楽しみにしておきます」のように語の途中に「み」「追」がある文や、「以下のように書きます」「最後に結果を見ます」は拾いません。「書きます」「見ます」は「次の節で」「以下で」などのすぐ後に来たときだけ拾います。「以下に説明します」「以下の手順で説明します」「続いてみていきます」「記事後半で詳しく説明します」は拾います。数・漢字・カタカナ・英字・%・ー・空白・「/」・「それ」「これ」のすぐ後の「以下」（「10以下の」「10 以下の」「docs/以下の」「それ以下の」）は範囲の「以下」とみなして拾いません。「〜として扱います」（「以下の場合は例外として扱います」）、「午後で、〜説明します」「終えたあとで、〜説明します」も拾いません。

```text
次に、インストールの手順を見ていきます。
→ このあと書くことを予告する文に見えます。予告をやめて、中身から書けないか確かめてください。
```

no-leading-conjunction は、文頭の語と直後の読点の組み合わせを見ます。

```text
読み込みは速くなった。ただし、書き込みは変わらない。
→ 文が「ただし」で始まっています。前の文とのつながりを、語に頼らずに書けないか確かめてください。
```

number-needs-base（試験中）は、「30%」「1,200件」のような数字と同じ文に、母数（「120件のうち」「200人中」など）や期間（「2026年9月」「90日で」など）が見当たらないときに指摘します。

```text
利用者の30%が使った。
→ 「30%」の母数と期間が同じ文に見当たりません。母数と期間を確かめてください。
```

## 調べない場所

見出し、コードブロック、表、引用（`>`）の中はどの規則も調べません。箇条書きは、もともと短く書く場所なので no-short-sentence-run だけが調べず、ほかの3つは項目の中の文も調べます。

## 誤検知しやすい場面と弱点

- 手順を1文ずつ書いた段落（「保存する。閉じる。開き直す。」）は、短い文の連続として指摘されます。手順は箇条書きにすると指摘されません
- 手順の中で実際に行う動作を書いた「最後に動作を確認しておきます。」は予告の文と区別できません。決まった言い方なら `allowPatterns` に入れてください
- 「ここからはインストールの話です。」のように、決まった動詞を使わない予告や、常体の予告（「次に考えてみる。」）は拾いません
- no-preview-sentence は、「以下の」で始まる範囲や条件の文（「以下の場合は別の手順を説明します。」）を予告とみなすことがあります。「以下の」の予告と範囲の「以下の」は文字の並びでは分けられません。「下記の担当者が対応を説明します。」のような文も拾います
- no-preview-sentence は、「食事のあとで、〜説明します」「会議の後で、〜説明します」「試合の後半で、〜扱います」のような、時を表す「の後で」「の後半で」も予告とみなします。「冷たさが体にしみていきます。」の「しみて」も「見て」とみなします。かっこ（）の中の言い方の例も調べます（「」『』の中だけを調べません）
- no-preview-sentence は、直前が漢字の「見」「以下」の予告（「様子見ていきます。」「詳細以下で説明します。」）と、「〜として扱います」の形の予告（「後ほど別の問題として扱います。」）を拾いません
- 例外を本当に限定したいときの「ただし、」も指摘されます。読み直して残すと決めた箇所は、そのままにして構いません
- 既定値（20文字、3文、語の一覧）は、実際の文章で当たり具合を確かめる前の仮の値です
- 自動での書き換え（`--fix`）には対応していません

## まだ合わない例

今の作りでは合わないと分かっている例を、テストの中に node:test の todo として16件残しています（`npm test` の集計の todo の数に出ます）。0.4.0 の時点では、16件とも期待する結果になっていません。内訳は次のとおりです。

| 件数 | 場所 | 中身 |
|---|---|---|
| 1 | test/config-loader.test.js | number-needs-base に `true` を書いてもオンにならない。textlint 15.8.0 の設定の読み込み（getRuleOptions）は、利用者の値が `true` のときと書かれていないときに、どちらも規則集の既定値を返すため、規則集の側から2つを見分けられない。代わりに `{}` を書く |
| 9 | test/no-preview-sentence.test.js | 拾うべきだが拾わない予告。決まった動詞を使わない予告（2件）、常体の予告（5件。うち4件は寺田寅彦「電車の混雑について」の文）、直前が漢字の「見」「以下」（2件） |
| 6 | test/no-preview-sentence.test.js | 拾ってはいけないが拾う文。手順の動作の「確認しておきます」（1件）、かっこ（）の中の言い方の例（1件）、時を表す「のあとで」「の後で」「の後半で」（3件）、ひらがなの「しみて」（1件） |

## 指摘を止める方法

設定で規則ごとに `false` にするほかに、textlint-filter-rule-comments を入れると、文書の中のコメントで一部だけ止められます。このパッケージの依存には入れていないので、別に入れて .textlintrc に `"filters": { "comments": true }` を足してください。規則集として使ったときの規則の名前は `ja-sentence-flow/` から始まります（textlint 15.8.0 と textlint-filter-rule-comments 1 系で、次の書き方で止まることを確かめました）。

```markdown
<!-- textlint-disable ja-sentence-flow/no-leading-conjunction -->
ただし、この段落は例外の説明なので残す。
<!-- textlint-enable ja-sentence-flow/no-leading-conjunction -->
```

`--rulesdir` で使ったときは、規則の名前に `ja-sentence-flow/` が付きません（例：`no-leading-conjunction`）。

## テスト

```sh
npm ci
npm test
```

規則ごとに、指摘されるべき文と指摘されてはいけない文を textlint-tester で確かめています。テストの文は、この規則集のために作った文と、公開の文章から取った文（寺田寅彦「電車の混雑について」〈青空文庫、著作権の切れた作品〉の文。出典は test/no-preview-sentence.test.js の注釈）です。0.4.0 の時点の結果は、tests 199、pass 183、fail 0、todo 16 です（Node.js 24、textlint 15.8.0）。

## ライセンスと依存

MIT ライセンスです（LICENSE を参照）。

依存は sentence-splitter 5 系と textlint-util-to-string 3 系（どちらも MIT）です。開発用に textlint、textlint-tester、@textlint/config-loader、@textlint/kernel、@textlint/textlint-plugin-markdown の 15.8.0（どれも MIT）を使っています。textlint 15 以上を peerDependencies に書いています。
