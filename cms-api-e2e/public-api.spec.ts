import { expect, test } from "@playwright/test";

const allowedOrigin = "https://mdftungphat.com";

const apiPayload = (overrides: Record<string, unknown> = {}) => ({
  submission_id: crypto.randomUUID(),
  full_name: "Khách kiểm thử",
  phone: "0909259160",
  material: "Ván MDF",
  consent: true,
  website: "",
  turnstile_token:
    process.env.CMS_STAGING_TURNSTILE_TOKEN || "invalid-test-placeholder",
  source_url: "https://gotungphat.com/bao-gia/",
  referrer: "",
  ...overrides,
});

test("API từ chối origin khác và không lộ stack trace", async ({ request }) => {
  const response = await request.post("/api/quote", {
    headers: {
      Origin: "https://attacker.example",
      "Content-Type": "application/json",
    },
    data: {},
  });
  expect(response.status()).toBe(403);
  const body = await response.text();
  expect(body).not.toMatch(/stack|node_modules|Error:/i);
});

test("API trả CORS preflight chính xác cho origin được phép", async ({
  request,
}) => {
  const response = await request.fetch("/api/contact", {
    method: "OPTIONS",
    headers: {
      Origin: allowedOrigin,
      "Access-Control-Request-Method": "POST",
    },
  });
  expect(response.status()).toBe(204);
  expect(response.headers()["access-control-allow-origin"]).toBe(allowedOrigin);
  expect(response.headers()["access-control-allow-methods"]).toBe(
    "POST, OPTIONS",
  );
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(
    response.headers()["access-control-allow-credentials"],
  ).toBeUndefined();
});

test("API validation và rate limit hoạt động", async ({ request }) => {
  const quoteRoute = "/api/quote";
  const contactRoute = "/api/contact";
  const invalid = await request.post(quoteRoute, {
    headers: { Origin: allowedOrigin },
    data: { consent: false },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ code: "validation_failed" });
  const quoteWithoutMaterial = await request.post(quoteRoute, {
    headers: { Origin: allowedOrigin },
    data: apiPayload({ material: "" }),
  });
  expect(quoteWithoutMaterial.status()).toBe(400);
  expect(await quoteWithoutMaterial.json()).toMatchObject({
    code: "validation_failed",
  });
  const contactWithoutMessage = await request.post(contactRoute, {
    headers: { Origin: allowedOrigin },
    data: apiPayload({ message: "" }),
  });
  expect(contactWithoutMessage.status()).toBe(400);
  expect(await contactWithoutMessage.json()).toMatchObject({
    code: "validation_failed",
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post(quoteRoute, {
      headers: { Origin: allowedOrigin },
      data: apiPayload(),
    });
    expect(response.status()).toBe(201);
  }
  const limited = await request.post(quoteRoute, {
    headers: { Origin: allowedOrigin },
    data: apiPayload(),
  });
  expect(limited.status()).toBe(429);
  expect(await limited.json()).toMatchObject({ code: "rate_limited" });
});

test("API nhận submission idempotent mà không tạo lead lặp", async ({
  request,
}) => {
  const submissionId = crypto.randomUUID();
  const headers = { Origin: allowedOrigin };
  const first = await request.post("/api/quote", {
    headers,
    data: apiPayload({ submission_id: submissionId }),
  });
  expect(first.status()).toBe(201);
  const second = await request.post("/api/quote", {
    headers,
    data: apiPayload({ submission_id: submissionId }),
  });
  expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({ ok: true, duplicate: true });
});

test("payload kiểu SQL injection không làm thay đổi schema", async ({
  request,
}) => {
  const headers = { Origin: allowedOrigin };
  const injected = await request.post("/api/contact", {
    headers,
    data: apiPayload({
      full_name: "Robert'); DROP TABLE leads;--",
      message: "Kiểm tra query binding",
    }),
  });
  expect(injected.status()).toBe(201);
  const after = await request.post("/api/contact", {
    headers,
    data: apiPayload({
      full_name: "Kiểm tra bảng còn tồn tại",
      message: "Yêu cầu thứ hai",
    }),
  });
  expect(after.status()).toBe(201);
});
