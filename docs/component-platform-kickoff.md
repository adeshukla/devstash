# Kickoff Prompt — Component Platform (working name)

_Saved 2026-09-15. Paste everything below the line into a **new** Claude Code session,
started in an empty folder for the new project (ideally outside OneDrive, e.g. `C:\dev\`)._

---

You are starting a new product with me from zero. Read this whole brief before doing
anything. Then set the project up so any future session can continue exactly where the
last one stopped.

## Who I am

Adesh Shukla — UI developer, 6+ years, 200+ PPC landing pages shipped. Strong on CSS,
responsive layout, accessibility and web performance. I run **devstash.me** (my developer
site, Next.js 16) and **Praxis** (praxis.devstash.me, an interview-prep platform). This
product will be my next flagship project and will be shown on DevStash as a case study.

## The product

A platform of ready-made UI components that developers customise visually and then take
into their own project as plain code — no component library to install.

Components I want (examples, not the final list): header, footer, mega menu (2- and
3-level), forms with custom validation and accurate error messages, popups/modals, CTA
sections, custom dropdowns, custom calendar/date picker, custom select with search,
sliders, lazy loading.

The core idea is **control**. Users should change as much as possible without writing code:

- colors, text, spacing, sizes
- add-ons toggled on/off per component (e.g. clear button, icons, helper text)
- behaviour options (e.g. date format `DD/MM/YYYY` vs `YYYY/MM/DD`, single vs range selection)

Goal: people build the components their projects need much faster.
Long term: output available for all popular frameworks.

## Decisions already made (don't reopen without new evidence)

1. **Separate project** — own repo, own deploy, eventually its own subdomain (the Praxis
   pattern). Not a section inside DevStash: DevStash is a mostly-static content site with a
   strict performance budget, and this is an app.
2. **Needs its own distinctive name.** "DevStash" is already used by 6+ unrelated
   products. Use a neutral working name until I choose. Suggest 5 options with a one-line
   reason each. Don't register or publish anything under a name without my approval.
3. **Schema-driven architecture.** Each component has ONE options schema (type, default,
   allowed values, which options depend on others). The editor panel is generated from the
   schema, the live preview renders from the same config, and every code exporter reads
   that same config. One source of truth — no hand-maintained copy per output.
4. **Delivery without a runtime dependency:**
   - **Copy code** — the user gets plain source they own.
   - **Install by URL** — a shadcn-compatible registry (an HTTP endpoint serving registry
     JSON), so `npx shadcn add https://<site>/r/<component>.json` writes real source files
     into their project.
   - **No** hosted API or embed script that renders components — that is a dependency
     users can't control.
5. **MVP outputs: React + Tailwind, and vanilla HTML/CSS/JS** (truly no library). Other
   frameworks only after the MVP is actually being used.
6. **Multi-framework path is deliberately undecided.** Candidates: Mitosis (Builder.io —
   compiles one source to React, Vue, Angular, Svelte, Solid, Qwik) or Web Components.
   Decide with a spike on a complex component, not from docs. Never list a framework as
   supported unless its output passes the same tests.
7. **Accessible by default is the differentiator.** Follow WAI-ARIA Authoring Practices
   patterns: combobox for the searchable select, dialog for modals, grid keyboard
   navigation for the calendar, disclosure/menu for navigation. Test **every generated
   output** — not just the in-app preview — with Playwright + axe plus keyboard-only flows.

## MVP scope

- **Six components:** form with custom validation, searchable select, date picker with
  format options, modal/popup, CTA section, header.
- **Features:** schema-driven editor, live preview, copy code, registry-URL install,
  accessibility tests per output.
- **Not in MVP:** accounts, login, database, payments, teams, AI generation. Persist a
  user's configuration in the URL (shareable) and/or localStorage first.

## First milestone — prove feasibility with ONE component

Build the **date picker** end to end before anything else:

schema → generated editor panel → live preview → React + Tailwind export → vanilla export
→ Playwright/axe + keyboard tests on both exports.

Then write an honest feasibility report in `docs/PROGRESS.md`: what worked, what was harder
than expected, and whether the architecture holds for the other five components. If
something doesn't work, say so plainly — that result is as valuable as a success.

## Tech stack (match my environment)

- Next.js App Router (current stable), TypeScript strict, Tailwind CSS v4, **pnpm only**.
- Windows 11 dev machine. Things that have bitten me before:
  - Turbopack has crashed on this machine — if the dev server crashes, run without it.
  - Tailwind v4 design tokens live in `@theme` in CSS, not in `tailwind.config`.
  - Zod is v4 — its API differs from v3.
  - My DevStash repo lives inside OneDrive and has hit stale `.next` build failures
    (likely sync-related) — keep this repo outside OneDrive.
- Check the installed version of any library before writing code against it.

## Rules

- **No invented data:** no fake usage numbers, testimonials, benchmarks or "used by X
  developers". Use `[TODO: ...]` where real data belongs.
- **Don't overengineer:** boring, readable solutions; no abstraction for a single use.
- **Ask me first** before anything irreversible or public: final name, domain, making the
  repo public, production deploys.
- **Git:** commit small and often to a `dev` branch. Never merge to `main` or deploy to
  production unless I say "ship".

## Save your working — required

Future sessions start with no memory of this one, so keep state in the repo:

1. **`CLAUDE.md`** (project root, auto-loaded every session): product one-liner, the
   decisions above, stack and versions, rules, known gotchas. Keep it current — a stale
   CLAUDE.md is worse than none.
2. **`docs/PRD.md`**: vision, target users, MVP scope, non-goals, each component with its
   options.
3. **`docs/DECISIONS.md`**: dated log — decision, why, alternatives rejected. Add an entry
   whenever a real choice is made.
4. **`docs/PROGRESS.md`**: `Done` / `In progress` / `Next` / `Blockers & questions for
Adesh`, with dates. Update it at the end of every session and whenever you stop
   mid-task.
5. Also use your memory system for my preferences and feedback.

**Start of every session:** read `CLAUDE.md` and `docs/PROGRESS.md`, then tell me in three
lines where things stand and what you'll do next.

## This first session

1. Propose a working name plus 5 real name options (don't block on my answer).
2. Create `CLAUDE.md`, `docs/PRD.md`, `docs/DECISIONS.md` (seeded with the decisions
   above) and `docs/PROGRESS.md`.
3. Scaffold the Next.js project, `git init`, work on `dev`, first commit.
4. Start the date picker spike. If it isn't finished this session, update
   `docs/PROGRESS.md` with the exact state before stopping.
5. End with a short summary: done, next, and what you need from me.
