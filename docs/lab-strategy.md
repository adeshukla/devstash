# Lab strategy: fewer, deeper tools that people return to

Written 2026-11-02 after Adesh asked why the Lab is full of very small tools and what would
actually bring users to the site. This is research plus a decision. It is judgement, not
traffic data: no Search Console or keyword-volume data was available (see "What I could not find").

## The honest answer to "why so many small tools?"

Each tool was built to be a separate page with its own search phrase. That is a fair way to
get indexed, but it has a cost: eight shallow pages, none of them a reason to come back.
**Decision: no new Lab tools until the existing UTM tools meet the maturity bar below.**
The three tools added on 2026-11-02 (link checker, QR generator, report cleaner) stay, but
they are now treated as parts of one product, not as separate toys.

## What the research says

Sources are vendor and agency blogs unless noted, so treat claims as practitioner opinion.

1. **The real pain is naming drift and the damage that is already done.** Inconsistent
   capitalisation splits one campaign across rows; cleaning history is described as very hard or
   impossible, and none of the sources describe a feature that merges old values
   ([Garrett Digital](https://www.garrettdigital.com/blog/utm-parameters-ga4/),
   [Measure Marketing](https://measuremarketing.pro/blog/utm-mistakes-ga4-attribution),
   [Terminus](https://www.terminusapp.com/blog/why-is-my-utm-data-wrong-in-ga4-diagnostic/)).
   Fixes recommended: enforced inputs instead of free text, a shared approved-values list,
   validation before launch.
2. **Templates are table stakes, governance is the value.** HubSpot's Google Sheets template is
   the most-cited free one; one guide says that for larger teams the template matters far less than
   the governance around it ([Uplifter](https://uplifter.ai/article/utm-spreadsheet-templates),
   [UTM.io](https://web.utm.io/blog/utm-builder-spreadsheet-template/)).
3. **Several things are NOT unique:** GA4 channel prediction
   ([accs-net](https://accs-net.com/channel-group-predictor/), Chrome extensions) and single-link
   validators ([SourceLoop](https://sourceloop.ai/tools/free-utm-validator/)).
4. **Gaps I could not find a free tool for:** merging already-split rows in a report (only forum
   advice to use `LOWER(TRIM())` in Looker Studio), and shareable team naming rules without an
   account. These are the two things worth building around.
5. **Free tools earn links when they are genuinely useful, unique and shareable**, mostly through
   "best free tools" roundups and resource pages; Ahrefs, Moz and HubSpot all run suites of them
   ([Growth Method](https://growthmethod.com/engineering-as-marketing/),
   [The Stacc](https://thestacc.com/blog/free-tool-ideas-link-building/)). Links do not arrive by
   themselves: the sources list outreach to roundups as the mechanism.
6. **Why people come back to free utilities** (regex101, Squoosh, Excalidraw): no account, no
   upload, no watermark ([awesome-local-first-tools](https://github.com/toolsfam/awesome-local-first-tools)).
   I found no hard retention data, so "saved state makes people return" is a reasoned bet, not a fact.

## What this means for devstash.me

- `docs/seo-keywords.md` and the 2026-09 Search Console baseline already say the binding
  constraint is **zero external backlinks**, not page speed or page count. More pages do not fix
  that. A tool only helps if (a) it is the best answer for a specific need and (b) someone links to it.
- Broad queries ("QR code generator", "UTM builder") are owned by large sites. Winnable ground is
  the specific need: "merge duplicate UTM campaign rows GA4", "UTM naming rules for a team",
  "WhatsApp link with message".
- A tool does not keep visitors by existing. What keeps them is **their own work accumulating in
  it**: saved links, remembered names, remembered clean-up rules. That is the retention plan.

## Maturity bar (a tool earns "mature" when all are true)

1. Solves one real job end to end, with output people can use without another tool.
2. Remembers things on the device (saved list, names, rules) and can back them up and restore.
3. Hands work to the sibling tools instead of dead-ending (checker to saved list, cleaner rules).
4. Handles messy real input (GA4 export quirks, bad links) with plain-language errors.
5. Verified with real data from a real GA4 export or ad account, not only made-up samples.
6. Has at least one page that explains the problem (guide or FAQ) that can rank on its own.

Until the UTM tools meet 1-6, no new tools. Candidates are parked in `docs/lab-audit.md`.

## Plan

Done in this pass (2026-11-02):

- One shared workspace: saved links, channels, team rules, owner and remembered merges, with
  **Back up / Restore** as one file, so data survives a cleared browser and can be shared with a team.
- Report cleaner: editable clean names and **remembered merges** that apply automatically on the
  next export. This is the monthly-reporting habit loop.
- Link checker hands cleaned links to the saved list in one click.
- One toolkit nav across Build, Check, Clean reports and QR codes.
- Builder suggests campaign names you used before, so naming stays consistent.

Also done (2026-11-02, after Adesh reviewed the older tools): the Lab hub now leads with the UTM toolkit and shows the AI pipeline as an "Experiment" under it. The AI pipeline keeps its free daily cap (3 runs per browser per day, then bring your own key) and now writes nine content types (marketing, service, sales, product, company, explainer, case study, event, technical) with graphics in every page design.

Also done (2026-11-02): usage events for every Lab tool (`lab_tool_action`, carrying only the tool and the action, never typed content); campaign name pattern in team rules; ad versions in the link matrix; launch test checklist in the pack and builder; UPI payment QR (NPCI linking spec v1.6, newest public version found is from 2017, so users are told to test-pay); two guides (`ga4-campaign-names-split-by-capital-letters`, `utm-naming-convention-for-teams`); the nine AI pipeline content types were all run against the real model.

Also done (2026-11-02): the builder's secondary panels (team rules, import, checklist, backup) sit under one closed "More tools" section so the first screen stays the three steps; the toolkit's browser flows are now a repo test (`pnpm qa:toolkit`, 20 tests, also run on PRs into main). Lighthouse CI now also lists the four toolkit pages. Local Lighthouse on this machine is noisy (the existing /about page scored 75 performance), so judge the toolkit pages by CI or a Vercel preview, not by local numbers.

Also done (2026-11-02, hub and small tools): larger SVG previews; each hub card shows a real result computed by the tool's own code; a "What do you need to do?" row of jobs; an odd last card spans the row; a copy-link button per card; the meta tag generator can check pasted head tags; saved looks (name + share link, kept on the device) for the CSS, illustration and meta tools; a one-time backup reminder after five saved UTM links. Browser checks for these are in `tests/qa/lab.spec.ts` (run by `pnpm qa:toolkit`). The 200px responsive suite caught two real overflows during this work (a fieldset and the saved-looks block), both fixed.

Changed (2026-11-09): the standalone QR generator is no longer in the "UTM toolkit" group or its nav. It does not use the saved list, team rules or backup, so the toolkit copy overclaimed; the toolkit is now three tools (builder, checker, cleaner) and the builder still makes QR codes. Also added, as extensions of existing tools rather than new standalone ones: a WhatsApp link generator (`/lab/whatsapp-link-generator`) and an AI-crawler robots.txt check plus `robots.ts` opt-out inside the Next.js SEO Kit. The "no new tools" rule above still applies to anything else.

Next (needs Adesh or real data):

1. **Run it on a real GA4 export** and a real Looker Studio report; report which headers fail.
2. **Search Console after 4-6 weeks:** replace guessed phrases with real queries.
3. **Outreach (manual, the only thing that earns links):** submit to "best free UTM builder" and
   "GA4 tools" roundups, answer GA4 "campaign split by case" questions on Reddit and the GA community
   with the cleaner where it truly helps, post the case studies on dev.to/Hashnode with canonical set.
4. **Write the guides that can rank on their own:** "Fix GA4 campaign names split by capital letters",
   "UTM naming convention for a team (with template)". Posts follow `docs/launch-posts.md` rules.
5. **Decide the older tools** (CSS shapes, illustration generator, AI pipeline): keep, merge or retire.
   They are not in the UTM product and cost attention. Needs Adesh's call.
6. Parked: UPI QR (needs current NPCI spec), shareable team rules with a name pattern, ad-variant matrix.

## What I could not find

- Search volume or keyword difficulty for any term (no tool access). Use Keyword Planner or Search Console.
- Independent retention data for free tools.
- Whether any free tool already offers shareable team rules; absence in a limited search is not proof.
