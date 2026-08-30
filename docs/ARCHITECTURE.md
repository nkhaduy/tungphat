# Kiến trúc production

```text
mdftungphat.com (Vercel static frontend)
        |
        +--> cms.mdftungphat.com (Cloudflare Pages hostname gateway)
        +--> cdn.mdftungphat.com (Cloudflare Pages media gateway)
                    |
                    +--> Payload CMS Worker
                            +--> D1 tungphat-payload-cms
                            +--> R2 tung-phat-media
```

- Payload CMS là CMS và structured-data backend duy nhất.
- Cloudflare Pages tại `cms.mdftungphat.com` chuyển tiếp CMS request tới Payload; cùng gateway phục vụ `cdn.mdftungphat.com` bằng cách ánh xạ canonical media path sang R2 media route. DNS được quản lý tại Tenten và zone không thuộc tài khoản Cloudflare Workers.
- D1 `tungphat-payload-cms` lưu content, users, leads, analytics và review metadata.
- R2 `tung-phat-media` lưu binary media; Payload chỉ quản lý metadata/reference.
- Supplier crawler giữ nguyên normalize logic và đẩy output idempotent vào Payload bằng `npm run catalog:suppliers:sync:payload`.
- Canonical public luôn là `https://mdftungphat.com`; migration CMS không thay đổi public route.

## Deploy

- Frontend: Vercel Git Integration từ `main`.
- Payload Worker: build OpenNext rồi `wrangler deploy --env production` trong `payload-cms`.
- CMS hostname gateway: `wrangler pages deploy gateway --project-name tungphat-light-cms-production --branch main` trong `payload-cms`.
