import assert from "node:assert/strict";
import test from "node:test";
import { createIpLookupOverride } from "./network-lookup.mjs";

test("uses Node default DNS when no valid IP override exists", () => {
  assert.equal(createIpLookupOverride(undefined), undefined);
  assert.equal(createIpLookupOverride(""), undefined);
  assert.equal(createIpLookupOverride("not-an-ip"), undefined);
});

test("returns a validated IPv4 lookup result", async () => {
  const lookup = createIpLookupOverride(" 192.0.2.10 ");
  assert.ok(lookup);
  const result = await new Promise((resolve, reject) => {
    lookup("example.com", {}, (error, address, family) => error ? reject(error) : resolve({ address, family }));
  });
  assert.deepEqual(result, { address: "192.0.2.10", family: 4 });
});

test("supports Node lookups that request all addresses", async () => {
  const lookup = createIpLookupOverride("2001:db8::1");
  assert.ok(lookup);
  const result = await new Promise((resolve, reject) => {
    lookup("example.com", { all: true }, (error, addresses) => error ? reject(error) : resolve(addresses));
  });
  assert.deepEqual(result, [{ address: "2001:db8::1", family: 6 }]);
});
