# Tùng Phát Payload CMS

CMS production duy nhất cho hệ sinh thái Tùng Phát, chạy trên Payload CMS, Next.js và Cloudflare Workers.

## Kiến trúc

- Payload `3.88.0` với Next.js `16.2.11`, React `19.2.1` và TypeScript strict.
- D1 riêng `tungphat-payload-cms` qua `@payloadcms/db-d1-sqlite`.
- R2 production `tung-phat-media` qua `@payloadcms/storage-r2`.
- OpenNext Cloudflare `1.20.2`; production build dùng Webpack để tránh lỗi bundling D1/Drizzle của Turbopack.
- Montserrat local và token giao diện Bright Tùng Phát được định nghĩa trong `src/styles/`.

Content model, access control, migration và integration contract được ghi trong:

- [`docs/DECAP_TO_PAYLOAD_AUDIT.md`](docs/DECAP_TO_PAYLOAD_AUDIT.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/MIGRATION_RUNBOOK.md`](docs/MIGRATION_RUNBOOK.md)
- [`docs/INTEGRATION.md`](docs/INTEGRATION.md)
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md)
- [`docs/IMPLEMENTATION_REPORT.md`](docs/IMPLEMENTATION_REPORT.md)

## Local setup

Yêu cầu Node `18.20.2+` (hoặc `20.9+`) và npm `10+`.

```bash
cd payload-cms
npm ci
cp .env.example .env
# Đặt PAYLOAD_SECRET bằng một chuỗi ngẫu nhiên chỉ dùng cho local
npm run migrate:local
npm run dev
```

Mở `http://localhost:3000/admin`. Tài khoản đầu tiên được tạo trong local sẽ tự động trở thành `super-admin`; không có tài khoản hay secret production nào được seed.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run integration
npm run test:e2e
PAYLOAD_SECRET=local-development-only-change-me CMS_ENVIRONMENT=local npm run check:migration
PAYLOAD_SECRET=local-development-only-change-me CMS_ENVIRONMENT=local npm run build
```

Ảnh nghiệm thu nằm trong `/output/playwright/payload-cms/` ở repository root.

## Deploy

```bash
npm run lint
npm run typecheck
npm run integration
npx opennextjs-cloudflare build
npx wrangler deploy --env production
npx wrangler pages deploy gateway --project-name tungphat-light-cms-production --branch main
```

Supplier sync production dùng `npm run sync:suppliers:production` sau khi crawler/normalizer cập nhật artifacts.

## Cloudflare notes

Local bindings được Wrangler quản lý trong `.wrangler/`. Production dùng REST/admin path làm contract chính; GraphQL vẫn chịu giới hạn upstream của Workers.
