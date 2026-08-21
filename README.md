# Website Tùng Phát

Website vật liệu gỗ và gia công CNC, xây dựng bằng Next.js 15 App Router,
TypeScript và Tailwind. Website public chạy trên Vercel; Payload CMS chạy trên
Cloudflare Workers/D1/R2 tại `cms.mdftungphat.com`.

Workflow lâu dài chỉ dùng `main`: sửa trực tiếp, chạy quality gate, commit, push
`main`; Vercel Git Integration tự deploy website production. Nội dung được quản
lý trong Payload CMS.

## Chạy local

Yêu cầu Node.js 20.19–26 và npm theo `package-lock.json`.

```bash
npm ci
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Quality gate

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links
npm run test:e2e
git diff --check
```

Quality gate của Payload CMS:

```bash
npm --prefix payload-cms ci
npm --prefix payload-cms run lint
npm --prefix payload-cms run typecheck
npm --prefix payload-cms run integration
npm --prefix payload-cms run build
```

## Nội dung và vận hành

- Content source of truth: Payload collections/globals at `https://cms.mdftungphat.com/admin`.
- Frontend fetches Payload through `lib/content.ts` and `npm run sync:payload-build-data`; schema/validator: `lib/content-schema.ts` and `npm run validate:content`.
- CMS: `https://cms.mdftungphat.com/admin`; cấu hình ở `payload-cms/`.
- Ảnh mới: `public/uploads`; kiểm tra `npm run images:check`, tối ưu `npm run images:optimize`.
- D1 migrations và API production: `payload-cms/src/migrations/` và Payload endpoints.
- Frontend gọi form API qua một biến duy nhất:
  `NEXT_PUBLIC_FORMS_API_BASE=https://cms.mdftungphat.com`.
- Canonical: `https://mdftungphat.com` (không `www`).

Đọc trước khi vận hành: `docs/PROJECT_AUDIT.md`, `docs/ARCHITECTURE.md` và
`payload-cms/README.md`.
