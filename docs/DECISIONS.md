# DECISIONS.md | ScaleSmart Architecture Log

> **Purpose:** This doc prevents re-litigating solved problems.
> **Audience:** AI devs, future me, and anyone who asks "why not X?"
> **Rule:** If it's not in here, it wasn't important enough to decide.

---

## Core Philosophy

**Build the system that prevents the problem. Eliminate recurring costs.**

We optimize for:

1. **$0 infra** until revenue demands scale
2. **AI-readable code** over "enterprise patterns"
3. **Speed of iteration** over theoretical purity

---

## ADR-001: Google Sheets + Apps Script over Supabase/Postgres

**Date:** 2026-05-20
**Status:** Accepted

**Context:**
Needed a data layer for intake forms, lead tracking, and lightweight CRM. Tried Supabase, Firebase, Airtable.

**Decision:**
Use Google Sheets as database + Apps Script as backend/webhooks.

**Rationale:**

1. **Cost:** $0 vs $25-99/mo. Client already has Google Workspace.
2. **Visibility:** PM/clients can edit data without a dashboard build. Sheets IS the UI.
3. **Integration:** Native with Forms, Gmail, Drive. No Zapier tax.
4. **AI-friendly:** Claude/GPT can read/write CSV. Easier context than SQL for AI devs.
5. **Speed:** Webhook deployed in 3 minutes vs schema migrations + RLS policies.

**Trade-offs Accepted:**

- No real-time subscriptions → We don't need them. Form submits are async.
- 10M cell limit → We archive monthly. If we hit this, we have revenue to migrate.
- No row-level security → Data is client-scoped per Sheet. Good enough for MVP.

**When to revisit:** Monthly revenue > $10k MRR from a single client, or >50k rows/mo.

---

## ADR-002: MDX + /constants over Headless CMS

**Date:** 2026-05-20
**Status:** Accepted

**Context:**
Needed CMS for blogs, case studies, and landing page copy. Tried Sanity, Contentful, WordPress.

**Decision:**
Use MDX files in `/content` + TypeScript constants in `/src/constants`.

**Rationale:**

1. **Cost:** $0 vs $99/mo + per-seat pricing.
2. **Version control:** All content in git. Rollbacks, branches, diffs.
3. **AI context:** Antigravity can read entire `marketing.ts` in one prompt. CMS needs API calls.
4. **Type safety:** `as const` prevents typos. CMS gives you `any`.
5. **Deploy speed:** `git push` = deployed. No webhook/build delays.

**Trade-offs Accepted:**

- Non-devs can't edit → That's a feature. Marketing edits `marketing.ts` via PR. Code-checker protects it.
- No visual editor → MDX preview in VSCode + localhost. Good enough.

**When to revisit:** Hiring dedicated content team of 3+ non-devs.

---

## ADR-003: Code-Checker SOP over Manual Review

**Date:** 2026-05-20
**Status:** Accepted

**Context:**
AI devs ship bugs. Manual review doesn't scale. See `/content/blog/code-checker-sop.mdx`.

**Decision:**
All merges blocked unless `npm run check` passes. Code-checker generates fix prompts.

**Rationale:**

1. **Verification cost → $0:** Automation vs senior dev hours.
2. **Consistency:** Rules don't have bad days.
3. **Self-healing:** AI fixes its own output via PRG loop.

**Trade-offs Accepted:**

- Slower first commit → Faster total time-to-prod.
- Can't "just ship it" → That's the point.

---

## ADR-004: Next.js 16 + React 19 over Remix/SvelteKit

**Date:** 2026-05-20
**Status:** Accepted

**Decision:**
Stick with Next.js App Router.

**Rationale:**

1. **Hiring:** Every AI + dev knows it.
2. **Ecosystem:** Shadcn/UI, Vercel, RSC patterns = velocity.
3. **MDX:** First-class support for content layer.

**Trade-offs Accepted:**

- Vercel hosting cost → Hobby tier free. If we scale, we can self-host or have revenue.

---

## Template for New Decisions

```md
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated

**Context:**
What problem forced this decision?

**Decision:**
What are we doing?

**Rationale:**

1. Why this vs alternatives?
2. Key benefits

**Trade-offs Accepted:**

- What are we giving up?

**When to revisit:**
Trigger condition for re-evaluating
```
