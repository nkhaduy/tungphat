import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/worker/password";

const legacyHash = "v1$argon2id$m=19456,t=2,p=1$AQIDBAUGBwgJCgsMDQ4PEA$j4NA6jkU65ju-fqYM67fcwD99_VFhrx_ZeYxgDvNxQw";

describe("password hashing", () => {
  it("creates and verifies the Worker-safe PBKDF2 format", async () => {
    const encoded = await hashPassword("ProductionPass!123");
    expect(encoded).toMatch(/^v2\$pbkdf2-sha256\$i=100000\$/);
    await expect(verifyPassword("ProductionPass!123", encoded)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass!123", encoded)).resolves.toBe(false);
  });

  it("keeps existing Argon2id v1 hashes valid", async () => {
    await expect(verifyPassword("LegacyPass!123", legacyHash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass!123", legacyHash)).resolves.toBe(false);
  });
});
