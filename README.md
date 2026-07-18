# Website Tùng Phát

Website vật liệu gỗ và gia công CNC, xây dựng bằng Next.js 15 App Router,
TypeScript và Tailwind. Website public chạy trên Vercel; Decap CMS, GitHub
OAuth, form API, Turnstile và D1 chạy trong project Cloudflare Pages riêng tại
`cms.mdftungphat.com`.

Workflow lâu dài chỉ dùng `main`: sửa trực tiếp, chạy quality gate, commit, push
`main`; Vercel Git Integration tự deploy website production. Decap cũng publish
trực tiếp vào `main`, vì vậy content mới đi theo cùng workflow.

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

Quality gate của CMS:

```bash
npm --prefix cloudflare-cms ci
npm --prefix cloudflare-cms run lint
npm --prefix cloudflare-cms run typecheck
npm --prefix cloudflare-cms test
npm --prefix cloudflare-cms run build
npm --prefix cloudflare-cms run validate:cloudflare-config
npm --prefix cloudflare-cms run cms:dry-run
```

## Nội dung và vận hành

- Content: `content/articles`, `content/products`, `content/projects`, `content/pages`.
- Schema: `lib/content-schema.ts`; validator: `npm run validate:content`.
- CMS: `https://cms.mdftungphat.com`; cấu hình ở
  `cloudflare-cms/public/config.yml`. `/admin` trên website redirect 308 tới CMS.
- Ảnh mới: `public/uploads`; kiểm tra `npm run images:check`, tối ưu `npm run images:optimize`.
- D1 migrations và API production: `cloudflare-cms/migrations/` và
  `cloudflare-cms/functions/`.
- Frontend gọi form API qua một biến duy nhất:
  `NEXT_PUBLIC_FORMS_API_BASE=https://cms.mdftungphat.com`.
- Canonical: `https://mdftungphat.com` (không `www`).

Đọc trước khi vận hành: `docs/PROJECT_AUDIT.md`, `docs/ARCHITECTURE.md`,
`docs/CLOUDFLARE_DEPLOYMENT.md`, `docs/CMS_GUIDE.md`,
`docs/D1_OPERATIONS.md` và `docs/BACKUP_AND_RECOVERY.md`.
