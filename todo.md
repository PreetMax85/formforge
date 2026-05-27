# FormForge — Deployment Done

> **Status**: Deployed 2026-05-27
> **Frontend**: https://formforge.jdevs.codes
> **API**: https://api.formforge.jdevs.codes
> **API Docs**: https://api.formforge.jdevs.codes/docs

---

## DEPLOYMENT STATUS

- [x] Vercel project for `apps/web` (with `NEXT_PUBLIC_API_URL`)
- [x] Railway for `apps/api` (Dockerfile + custom domain)
- [x] Custom domains: `formforge.jdevs.codes` + `api.formforge.jdevs.codes`
- [x] SSL auto-provisioned on both
- [x] Neon DB connected
- [x] README updated with live URLs + demo creds

---

## PENDING (if time permits)

See original backlog items below — these were not completed before deadline.

- [ ] Fix creator-email bug (`responses.service.ts`: extend `with:` clause + use `form.creator.email`)
- [ ] Write 11 Vitest tests (responses.service, analytics.service, schemas)
- [ ] Conditional logic UI in `FieldInspector.tsx`
- [ ] Form clone/duplicate endpoint
- [ ] Zustand `isDirty` tracking
- [ ] CSRF middleware
- [ ] Per-page `metadata`
- [ ] `robots.txt` + `sitemap.xml`
- [ ] Custom favicon

---

## ORIGINAL BACKLOG (preserved)

See git history for the full pre-deployment todo.
