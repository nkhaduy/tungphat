import { describe, expect, it } from "vitest";
import { decryptPassword, encryptPassword } from "../src/worker/password-vault";

describe("password vault", () => {
  it("encrypts employee passwords for admin-only recovery", async () => {
    const secret = "production-session-secret-with-at-least-32-characters";
    const password = "MatKhauMoi-2026";
    const ciphertext = await encryptPassword(password, secret);
    expect(ciphertext).not.toContain(password);
    expect(await decryptPassword(ciphertext, secret)).toBe(password);
  });

  it("does not decrypt with another session secret", async () => {
    const ciphertext = await encryptPassword("MatKhauMoi-2026", "production-session-secret-with-at-least-32-characters");
    await expect(decryptPassword(ciphertext, "another-production-secret-with-at-least-32-characters")).rejects.toThrow();
  });
});
