# Floating Zalo Contact Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's generic floating chat icon with the supplied Zalo logo and a restrained, accessible shake animation, then deploy it through the existing Vercel workflow.

**Architecture:** Keep the existing server-rendered `TrackedLink` and analytics behavior. Use a static optimized logo asset plus narrowly scoped CSS keyframes, avoiding a client component and new runtime dependencies.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3, CSS keyframes, Playwright, Sharp, Vercel Git Integration.

## Global Constraints

- Change only the floating contact link on the homepage.
- Preserve the existing Zalo destination, analytics event, link semantics, accessible label, and external-link security attributes.
- Keep the floating button hidden below the `md` breakpoint because the sticky mobile contact bar remains primary on mobile.
- Use a 64px circular desktop control with the supplied Zalo artwork, a white edge, soft shadow, and restrained motion.
- Honor `prefers-reduced-motion` and gate hover movement to fine pointers.
- Do not add a client component or animation dependency.

---

### Task 1: Branded Floating Zalo Control

**Files:**
- Create: `public/images/zalo-contact.png`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `e2e/site.spec.ts`

**Interfaces:**
- Consumes: `ZALO_URL`, `TrackedLink`, and the existing `home_floating` analytics location.
- Produces: a desktop-only link named `Mở Zalo Tùng Phát` containing decorative image `/images/zalo-contact.png`, container class `floating-zalo`, and image class `floating-zalo__logo`.

- [ ] **Step 1: Write the failing Playwright test**

Add this test to `e2e/site.spec.ts`:

```ts
test("homepage uses the branded floating Zalo control only outside mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const floatingZalo = page.getByRole("link", { name: "Mở Zalo Tùng Phát" });
  await expect(floatingZalo).toBeVisible();
  await expect(floatingZalo.locator('img[src="/images/zalo-contact.png"]')).toHaveCount(1);
  await expect(floatingZalo).toHaveClass(/floating-zalo/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(floatingZalo).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Liên hệ nhanh" })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run the static site and execute:

```bash
npm run build
npm run cf:test-server
npx playwright test e2e/site.spec.ts --grep "branded floating Zalo" --reporter=list
```

Expected: FAIL because the current floating link contains a Lucide SVG and does not have class `floating-zalo` or image `/images/zalo-contact.png`.

- [ ] **Step 3: Generate the optimized logo asset**

Generate a 256px transparent PNG from the supplied artwork:

```bash
node -e 'const sharp=require("sharp"); sharp("/var/folders/mn/2lhqkd356_9ckmvb7gh29zgr0000gn/T/codex-clipboard-4dcd0169-a009-407f-9972-19fa140d3043.png").resize(256,256,{fit:"contain"}).png({compressionLevel:9,palette:true}).toFile("public/images/zalo-contact.png")'
```

- [ ] **Step 4: Render the branded image**

In `app/page.tsx`, remove the `MessageCircle` import, add `Image` from `next/image`, change the link to `h-16 w-16`, add class `floating-zalo`, and render:

```tsx
<Image
  src="/images/zalo-contact.png"
  alt=""
  width={64}
  height={64}
  className="floating-zalo__logo h-full w-full rounded-full object-contain"
  aria-hidden="true"
/>
```

- [ ] **Step 5: Add restrained animation styles**

Add scoped rules to `app/globals.css`:

```css
.floating-zalo {
  isolation: isolate;
  box-shadow: 0 12px 30px rgba(0, 104, 255, .28), 0 4px 12px rgba(7, 59, 40, .18);
  transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) ease;
}

.floating-zalo::before {
  content: "";
  position: absolute;
  inset: 3px;
  z-index: -1;
  border-radius: 999px;
  background: rgba(0, 104, 255, .25);
  animation: floating-zalo-pulse 4s var(--ease-out) infinite;
}

.floating-zalo__logo {
  transform-origin: 50% 80%;
  animation: floating-zalo-shake 4s var(--ease-out) infinite;
}

@keyframes floating-zalo-shake {
  0%, 8%, 16%, 24%, 100% { transform: rotate(0deg); }
  4%, 12%, 20% { transform: rotate(-7deg); }
  6%, 14%, 22% { transform: rotate(7deg); }
}

@keyframes floating-zalo-pulse {
  0%, 24%, 100% { opacity: 0; transform: scale(.92); }
  8% { opacity: .38; transform: scale(1.18); }
  18% { opacity: 0; transform: scale(1.32); }
}

@media (hover: hover) and (pointer: fine) {
  .floating-zalo:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 16px 34px rgba(0, 104, 255, .34), 0 6px 16px rgba(7, 59, 40, .2);
  }

  .floating-zalo:hover .floating-zalo__logo {
    animation-play-state: paused;
  }
}
```

The existing reduced-motion media query disables both animations globally.

- [ ] **Step 6: Run focused verification and verify GREEN**

Run:

```bash
npx playwright test e2e/site.spec.ts --grep "branded floating Zalo" --reporter=list
```

Expected: PASS with the branded image visible at 1280px and the floating control hidden at 390px.

- [ ] **Step 7: Commit the independently working control**

```bash
git add app/page.tsx app/globals.css public/images/zalo-contact.png e2e/site.spec.ts
git diff --cached --check
git commit -m "feat: add animated Zalo contact button"
```

---

### Task 2: Visual And Production Verification

**Files:**
- Verify: `app/page.tsx`
- Verify: `app/globals.css`
- Verify: `public/images/zalo-contact.png`
- Verify: `e2e/site.spec.ts`

**Interfaces:**
- Consumes: the completed `floating-zalo` implementation from Task 1.
- Produces: verified build artifacts and a production deployment on `origin/main`.

- [ ] **Step 1: Inspect desktop and mobile screenshots**

Capture the homepage at 1280x800 and 390x844. Confirm the desktop logo is sharp, circular, offset from the safe edge, and does not cover content; confirm mobile shows only the sticky action bar.

- [ ] **Step 2: Review motion quality**

Check that the animation uses only `transform` and `opacity`, pauses for most of the four-second cycle, stops movement for reduced-motion users, and gates hover motion behind fine-pointer capability.

- [ ] **Step 3: Run the full quality gate**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links
npx playwright test e2e/site.spec.ts --grep "homepage uses the branded floating Zalo|homepage có hero" --reporter=list
git diff --check
```

Expected: every command exits 0 with no lint errors, type errors, test failures, build errors, broken internal links, or whitespace errors.

- [ ] **Step 4: Push the verified commits**

```bash
git push origin main
```

Expected: `origin/main` advances to the local implementation commit and Vercel Git Integration starts a production deployment.

- [ ] **Step 5: Verify production**

Open `https://mdftungphat.com/` after deployment completes. Confirm the branded floating Zalo control is visible on desktop, hidden on mobile, links to the configured Zalo destination, and loads `/images/zalo-contact.png` successfully.
