# Website Tùng Phát

Website vật liệu gỗ và gia công CNC, xây dựng bằng Next.js 15 App Router, TypeScript và Tailwind. Site static chạy trên Cloudflare Pages; form dùng Pages Functions + D1; nội dung Git/Markdown được quản lý tại `/admin` bằng Decap CMS.

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
```

Preview gần production:

```bash
npm run d1:migrate:local
npm run cf:preview
```

## Nội dung và vận hành

- Content: `content/articles`, `content/products`, `content/projects`, `content/pages`.
- Schema: `lib/content-schema.ts`; validator: `npm run validate:content`.
- CMS: `/admin`; cấu hình ở `public/admin/config.yml`.
- Ảnh mới: `public/uploads`; kiểm tra `npm run images:check`, tối ưu `npm run images:optimize`.
- D1 migrations: `migrations/`; API: `functions/api/contact.ts`, `functions/api/quote.ts`.
- Canonical: `https://mdftungphat.com` (không `www`).

Đọc trước khi vận hành: `docs/PROJECT_AUDIT.md`, `docs/ARCHITECTURE.md`,
`docs/CLOUDFLARE_DEPLOYMENT.md`, `docs/CMS_GUIDE.md`,
`docs/D1_OPERATIONS.md` và `docs/BACKUP_AND_RECOVERY.md`.
