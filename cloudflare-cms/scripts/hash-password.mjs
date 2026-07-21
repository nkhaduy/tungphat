import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";
import { argon2id } from "@noble/hashes/argon2.js";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
// Secure line-oriented prompts append a transport newline; password inputs in the CMS cannot contain one.
const password = Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
if (password.length < 12 || password.length > 1024) {
  process.stderr.write("Mật khẩu phải có từ 12 đến 1024 ký tự.\n");
  process.exit(1);
}

const salt = randomBytes(16);
const memoryKiB = 19_456;
const timeCost = 2;
const parallelism = 1;
const hash = argon2id(password, salt, {
  t: timeCost,
  m: memoryKiB,
  p: parallelism,
  version: 0x13,
  dkLen: 32,
  maxmem: 32 * 1024 * 1024,
});
process.stdout.write(
  `v2$argon2id$v=19$m=${memoryKiB},t=${timeCost},p=${parallelism}$${salt.toString("base64url")}$${Buffer.from(hash).toString("base64url")}`,
);
