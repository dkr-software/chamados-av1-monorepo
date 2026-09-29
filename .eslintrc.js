/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ["**/routeTree.gen.ts"],
  extends: ["@repo/eslint-config/index.js"],
};
