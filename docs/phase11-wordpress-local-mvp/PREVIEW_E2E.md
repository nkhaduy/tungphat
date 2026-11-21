# Local WordPress article preview

## Kiểm tra quyền bổ sung

Một tài khoản Subscriber riêng chỉ trên Playground đã đăng nhập thật và yêu cầu `http://127.0.0.1:4187/preview/45`; Next trả HTTP 404. Đây là kiểm tra có phiên đăng nhập nhưng không có quyền `edit_post`, bổ sung cho các trường hợp vô danh và cookie không hợp lệ. Preview dựa vào phiên WordPress, không sử dụng token riêng; hết hạn phiên hoặc thu hồi quyền cần được kiểm tra trong luồng riêng nếu yêu cầu bằng chứng về phiên hết hạn.

This is a separate Next.js development runtime; it does not alter the production static export. Run WordPress Playground at `http://127.0.0.1:9400` and install the repository's editorial `workspace.php` in its local MU plugin only after coordinating with anyone using the site. Do not copy or replace its database, posts, or uploads. Start the server from the repository root:

```sh
cd wordpress-local/preview-app
../../node_modules/.bin/next dev --hostname 127.0.0.1 --port 4187
```

Sign in to WordPress on `127.0.0.1` as an editor with permission to edit the post. Save the post and use **Xem trước trên website** in the post editor's sidebar. The preview shows the last saved version, not unsaved changes or an autosave revision. Cookies are host-specific: `localhost` is not interchangeable with `127.0.0.1`. Leave both services on loopback; this design is not for deployment, sharing, or reverse proxying.

Every request forwards only the browser's WordPress logged-in cookie to the fixed local WordPress endpoint. WordPress validates that cookie and the user's `edit_post` capability for that specific post; no shared preview token is used. The Next page and WordPress endpoint use no-store and noindex headers. The Next server refuses missing cookies and redirects, and sends Playground's auto-login suppression cookie. A WordPress login may be established automatically by Playground in a fresh browser: test denial with an isolated client that never follows redirects and explicitly sends `playground_auto_login_already_happened=1`. A browser already auto-logged in as admin is not an anonymous test.

Focused checks:

```sh
node --test wordpress-local/preview-app/preview.test.mjs
node --test wordpress-local/preview-app/preview-e2e.test.mjs
PREVIEW_EDITOR_AUTH_FILE=/private/path/to/editor-auth.json node --test wordpress-local/preview-app/editor-e2e.test.mjs
./node_modules/.bin/tsc --noEmit -p wordpress-local/preview-app/tsconfig.json
```

The E2E command requires both running services and the updated MU plugin. Its anonymous test is mandatory. To run its optional editor assertion, provide `PREVIEW_POST_ID` and `PREVIEW_EDITOR_COOKIE` securely in your local shell; the latter is the browser's `wordpress_logged_in_...=...` cookie. Treat it like a password, never commit it or paste it in reports. The browser test accepts a private JSON file with `user` and `pass`, signs in with the Playground auto-login sentinel, follows the dashboard preview link, and compares the rendered title to the authorized WordPress response. Separately check a user without `edit_post` is denied and test the editor sidebar button in a browser. Do not publish or alter existing drafts merely to test preview.

Limitations: this is an editor-only view of saved post content; it is not a production publishing integration. The page uses the actual shared `ArticleLanding` template and its WordPress sanitizer, but omits the production root analytics providers. WordPress media may be public independently of this preview; this bridge does not make attachments private. It requires the local WordPress session and stops working when the session expires or access is revoked.

## Local verification, 18 November 2026

The repository plugin was copied to the active local Playground after coordination; Playground was not restarted. The previous `workspace.php` was saved at `/private/tmp/tungphat-workspace-before-preview.php`. The preview runtime listened only on `127.0.0.1:4187`. The focused helper tests passed (3/3); the anonymous/invalid-cookie E2E passed against the active WordPress endpoint, which returned 401 without a session; the optional cookie-based assertion was skipped in that run. A separate headless browser authenticated the temporary Editor using the sentinel, read draft 32 without editing it, followed its dashboard preview link, checked WordPress and Next responses, title, article content, no-store and noindex, and confirmed a non-post was denied. That browser test passed (1/1). Preview TypeScript and focused ESLint passed.

The Gutenberg sidebar button itself has not been clicked in this verification: opening an existing post in the editor sets a WordPress edit lock, and the other editor's disposable post was explicitly off-limits. The separate dashboard link was clicked instead. An authenticated account lacking `edit_post` was not available, so the per-user denial has not been demonstrated end-to-end; the endpoint checks WordPress's `user_can($user_id, 'edit_post', $post->ID)` each time. No draft was edited or published. A native PHP lint check was unavailable because PHP is not installed on the host.

A subsequent read-only acceptance run used Editor-created draft 45: the authenticated browser followed the dashboard preview link, compared its title and saved paragraph to the WordPress response, and checked the article template and protection headers. Anonymous and malformed-cookie requests were denied for the same draft. The editor screen was not opened, so this did not create an edit lock or verify the sidebar button; SEO metadata rendering was not asserted. The draft was not modified or published.

## Native preview, media and visual follow-up

The local-only plugin update makes Gutenberg's native **Xem → Xem trước ở tab mới** open the Next preview for an editable draft. A browser test clicked that control on disposable draft 45 and reached the shared `ArticleLanding` template. The native preview currently shows the saved post, not unsaved editor changes or a user's autosave revision; save the draft first. The plugin's REST-link change is limited to local, edit-context responses for posts the current user can edit; the WordPress preview-link filter is likewise local and permission checked. The plugin was copied into the existing Playground with advance notice and no WordPress restart.

The original screenshot exposed missing Tailwind utilities because the Next development server was started before the local Tailwind/PostCSS config was added. Restarting the isolated preview server loaded that config; the generated CSS grew from about 32 KB to 119 KB and the shared template rendered correctly. Screenshots: [desktop](evidence/next-preview-desktop.png) and [mobile](evidence/next-preview-mobile.png), captured from the authenticated browser at 1440×900 and 390×844. Neither viewport had horizontal overflow.

Featured media ID 48 loads successfully in the hero. Its source PNG is a single solid green color; the plain green hero is therefore expected with this fixture and the shared template's dark overlay. With explicit permission to edit disposable draft 45, an inline image, caption, and table were appended and saved; the rendered image had a nonzero natural width and the caption and table text were present in the Next page. Screenshots were refreshed after adding those blocks. Drafts 32–34 were not edited. These media checks do not establish parity for all Gutenberg blocks.

The lower-privilege test was subsequently completed as recorded above: a signed-in Subscriber was denied draft 45. Session-expiry and revocation E2E remain untested. No production deployment, build, or full repository verification was run.

Run the authenticated browser scripts sequentially: one combined parallel run produced a WordPress login redirect/timeout for the dashboard test while the native test passed. The dashboard test passed when rerun alone. The focused TypeScript check passed; focused ESLint reported no errors and two existing anonymous-default-export warnings in the preview configuration files.
