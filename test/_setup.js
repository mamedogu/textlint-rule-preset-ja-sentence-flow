"use strict";
// textlint-tester は describe / it を globalThis から探す。node:test のものを渡す。
const { describe, it } = require("node:test");
globalThis.describe = describe;
globalThis.it = it;
module.exports = require("textlint-tester").default;
