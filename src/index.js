"use strict";
module.exports = {
  rules: {
    "no-short-sentence-run": require("./rules/no-short-sentence-run"),
    "no-preview-sentence": require("./rules/no-preview-sentence"),
    "no-leading-conjunction": require("./rules/no-leading-conjunction"),
    "number-needs-base": require("./rules/number-needs-base"),
  },
  rulesConfig: {
    "no-short-sentence-run": true,
    "no-preview-sentence": true,
    "no-leading-conjunction": true,
    "number-needs-base": false, // 試験中で、既定はオフ
  },
};
