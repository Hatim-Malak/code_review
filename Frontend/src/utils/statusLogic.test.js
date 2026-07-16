import assert from "node:assert";
import { getDisplayStatus } from "./statusLogic.js";

function runTests() {
  console.log("Running Status Logic Tests...");

  // Exception cases
  assert.strictEqual(getDisplayStatus("failed", { error: 0, warning: 0, info: 0 }), "failed", "failed status should remain failed");
  assert.strictEqual(getDisplayStatus("in_progress", { error: 0, warning: 0, info: 0 }), "in_progress", "in_progress should remain in_progress");
  assert.strictEqual(getDisplayStatus("pending", { error: 0, warning: 0, info: 0 }), "pending", "pending should remain pending");

  // Completed cases
  assert.strictEqual(getDisplayStatus("completed", { error: 0, warning: 0, info: 0 }), "clean", "0 findings should be clean");
  assert.strictEqual(getDisplayStatus("completed", null), "clean", "null breakdown should be clean");
  
  assert.strictEqual(getDisplayStatus("completed", { error: 1, warning: 0, info: 0 }), "errors_found", ">0 errors should be errors_found");
  assert.strictEqual(getDisplayStatus("completed", { error: 1, warning: 5, info: 5 }), "errors_found", "Errors take precedence over warnings");

  assert.strictEqual(getDisplayStatus("completed", { error: 0, warning: 1, info: 0 }), "needs_attention", ">0 warnings with 0 errors should be needs_attention");
  assert.strictEqual(getDisplayStatus("completed", { error: 0, warning: 0, info: 1 }), "needs_attention", ">0 info with 0 errors should be needs_attention");
  assert.strictEqual(getDisplayStatus("completed", { error: 0, warning: 2, info: 2 }), "needs_attention", "warnings and info with 0 errors should be needs_attention");

  console.log("All tests passed! 🎉");
}

runTests();
