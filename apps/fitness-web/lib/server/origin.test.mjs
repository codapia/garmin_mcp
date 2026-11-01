import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedBrowserOrigin } from "./origin.ts";

test("accepts the official public Fitness origin", () => {
  assert.equal(isAllowedBrowserOrigin("https://fitness.codapia.cl"), true);
});
test("rejects an absent Origin header (browser POSTs must have Origin)", () => {
  assert.equal(isAllowedBrowserOrigin(null), false);
});
test("rejects another site including a subdomain spoof", () => {
  assert.equal(isAllowedBrowserOrigin("https://evil.example"), false);
  assert.equal(isAllowedBrowserOrigin("https://fitness.codapia.cl.evil.example"), false);
});
test("rejects plain HTTP, unexpected ports, or mismatching paths", () => {
  assert.equal(isAllowedBrowserOrigin("http://fitness.codapia.cl"), false);
  assert.equal(isAllowedBrowserOrigin("https://fitness.codapia.cl:8443"), false);
  assert.equal(isAllowedBrowserOrigin("https://fitness.codapia.cl/"), false);
});
test("supports an explicit local testing origin without weakening production default", () => {
  assert.equal(isAllowedBrowserOrigin("http://localhost:3000", "http://localhost:3000"), true);
  assert.equal(isAllowedBrowserOrigin("https://fitness.codapia.cl", "http://localhost:3000"), false);
});
