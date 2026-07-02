# Saved plan — Meta Tag draft "shuffle" + character illustration rework

**Status (updated):**

- Request 1 (Meta Tag shuffle) — **DONE.** `components/lab/metaDraftEngine.ts`
  now returns `{ titleCandidates, descriptionCandidates }`; verified against
  3 sample inputs via a throwaway node script before wiring in.
  `components/lab/MetaTagGenerator.tsx` has independent Shuffle controls
  (with an "N/total" indicator) on both the Title and Description fields.
- Request 2 (character rework) — **v1 done for the `wave` scene ONLY, awaiting
  user sign-off.** `components/lab/characterEngine.tsx` gained a new
  `personChibi()` used solely by `sceneWave()` — bezier torso/limb paths,
  chibi proportions, bigger expressive face + blush, a periodic blink loop,
  and a separate `waveSmooth` easing so the other 6 scenes (still on the
  original `person()`) are untouched. Coordinates were checked numerically
  to confirm they fit the 400×225 viewBox, but this was implemented WITHOUT
  browser/screenshot verification — no chromium-cli or browser tool was
  available in this session/environment, matching the constraint noted
  below. **Next step: user needs to actually look at it** (`pnpm dev` →
  `/lab/illustration-generator` → Character style → "Wave hello" scene) and
  give feedback before the geometry is rolled out to the other 6 scenes.

---

## Request 1 — Meta Tag Generator: smarter, non-literal title/description + shuffle

### What's wrong today

`components/lab/metaDraftEngine.ts` picks the single best-scoring sentence
(word-frequency + lead-paragraph bias) and truncates it. That means:

- The description is always a **verbatim sentence** from the input, just
  cut off — it reads as "copied," not "written."
- There's exactly one result. No alternates, no way to see a different take
  without re-editing the pasted content.

User's own framing, verbatim: _"you should phrase it from that content but
it should be extracted version where you cannot find the whole sentence at
once but it is analyzed and reviewed content... there should be a shuffle in
the final output so the current and other option will be there for a
user."_ They explicitly acknowledged the "not an AI call" constraint — they
are **not** asking for a real LLM integration, they're asking for a smarter
local algorithm plus multiple candidates to cycle through.

### Two feasibility paths

**Path A — stay 100% local (recommended, do this first)**

No new infra, no API key, no cost, no latency, keeps the tool's existing
"nothing is sent anywhere" privacy promise intact.

Technical approach:

1. **Keyphrase-assembly titles, not sentence-copy titles.** Instead of
   truncating one sentence, extract the top 3–5 significant keywords
   (already have frequency scoring in `scoreSentences`/`words`) and the
   single strongest short clause, then assemble a title from parts —
   e.g. combine the top noun-phrase-like fragment from the best sentence
   with a couple of high-frequency terms, rather than "first N words of a
   sentence." This is a real algorithmic step beyond extraction (more like
   "phrase composition from analysis"), while staying honest about being a
   heuristic, not generation.
2. **Multiple ranked candidates, not one pick.** Compute the top 4
   sentence/phrase candidates for description (already have scores for
   every sentence — currently only the #1 is used) and top 3–4 title
   candidates (heading line if present, best sentence → phrase, 2nd-best
   sentence → phrase, keyword-combo title). Store all of them.
3. **"Shuffle" cycles through candidates**, independently for title and
   description (title shuffle and description shuffle don't need to be
   locked together). Show a small indicator like "Option 2 of 4" so the
   user knows there's more to cycle through, and keep fields freely
   editable after picking one — same UX pattern as the character
   generator's existing "Shuffle layout" button.
4. **Condensed multi-clause description option** as one of the candidates:
   stitch the strongest clause of sentence A with the strongest clause of
   sentence B (`"${clauseA} — ${clauseB}"`) instead of always showing one
   full original sentence. This is the concrete fix for "you cannot find
   the whole sentence at once."

Files touched: `components/lab/metaDraftEngine.ts` (rewrite to return
`{ titleCandidates: string[], descriptionCandidates: string[] }` instead of
one `DraftResult`), `components/lab/MetaTagGenerator.tsx` (shuffle buttons +
candidate index state, replacing the single "Draft title & description"
button's one-shot output).

Effort: medium, self-contained, no new dependencies. Testable the same way
the last fix was verified — mirror the logic into a throwaway Node script
and run it against realistic multi-paragraph sample content before touching
the real component, across several different sample inputs (short single
sentence, multi-paragraph blog intro, marketing copy with filler phrases)
to confirm variety and quality before shipping.

**Path B — optional future upgrade: real AI paraphrase (not proposed now)**

True paraphrasing (actually rewriting a sentence in different words) is not
something a local heuristic can honestly do — that requires a real language
model call. If ever wanted:

- Would need a Groq API call (the project already has Groq experience via
  the n8n automation blog posts / the Phase 10 idea in `CLAUDE.md`), a new
  server-side API route (e.g. `app/api/lab/draft-meta/route.ts`) so the key
  stays server-only, a `GROQ_API_KEY` env var, and a UI toggle clearly
  labeled "AI rewrite" — which would change the tool's current "fully
  client-side, nothing sent anywhere" promise and require rewriting that
  copy honestly.
- Adds real operational concerns for a public tool: rate limiting/abuse
  protection (anyone could hammer the endpoint), per-call cost, latency,
  and a fallback path when the API is down.
- **Not recommended as a first move.** Path A directly answers what the
  user asked for without any of this cost/complexity. Only worth revisiting
  if Path A's quality ceiling turns out to be unsatisfying after real use.

---

## Request 2 — Character illustrations: real animation/character quality bar

### Correction on scope

The user's message says "In CSS shape you did not understand..." but the
complaint is about **character faces**, which only exist in the
Illustration Generator's Character style (`components/lab/characterEngine.tsx`),
not the CSS Shapes & Animation Playground project (which has no characters
at all). Treating this as being about `characterEngine.tsx`.

### Research done (via WebFetch, this turn)

Fetched `svgator.com/blog/cool-svg-animation-examples-to-inspire` (the
`dribbble.com/tags/svg-animation` page is client-rendered and didn't return
usable content via fetch — would need an actual browser session to inspect,
noted as a follow-up if deeper reference-gathering is wanted later).

Findings relevant to what "good" looks like in this reference set:

- Character illustrations in this space (cartoon mascots, walking
  characters, a woman holding a key, a man walking his dog, etc.) are built
  from **smooth, custom bezier-curve silhouettes**, not stacked primitive
  rectangles/circles. That's the core visual gap versus the current
  `person()` implementation, which is literally rects + circles layered —
  it reads as "programmatic," which lines up with the user calling the
  current faces "not realistic even for a cartoon."
- Proportions in successful examples skew toward **chibi/mascot style**
  (bigger head relative to body) rather than realistic adult proportions —
  easier to hand-author convincingly _and_ closer to what the reference
  sites show.
- Faces are more expressive: bigger eyes (filled ellipses, not tiny dots),
  visible eyebrows, a mouth shape that can change (not just a thin stroke
  arc), sometimes blush/cheek accents.
- Animation techniques referenced: path-follow motion, shape morphing
  (structurally similar shapes only), stroke draw-in/out for line art,
  parallax depth via layered elements moving at different speeds, and
  concrete timing guidance — **sub-500ms for interaction feedback, motion
  loops under ~3 seconds** so nothing reads as "stuck," and generally
  smooth easing over linear/jerky keyframes.

### Planned technical approach

1. **Switch body-part geometry from rect/circle stacking to hand-authored
   bezier `<path>` silhouettes** — one smooth path each for the torso
   (with a natural rounded taper, not a rectangle), head (can stay a
   circle — heads read fine as circles even in top-tier examples), and
   limbs (tapered paths, not uniform-width rects). This is the single
   highest-leverage change for the "bad looking" complaint and is also the
   most labor-intensive — hand-crafting `d` path curves that look
   organically correct, not just technically valid SVG.
2. **Chibi/mascot proportions as the new default** — bigger head-to-body
   ratio, per the reference research. Consider exposing "Proportions:
   Chibi / Realistic" as a control alongside the existing masculine/
   feminine toggle, defaulting to chibi since it's both more forgiving to
   author well and closer to the reference aesthetic.
3. **Richer face**: larger filled-ellipse eyes, real eyebrow shapes, a
   filled mouth shape (capable of at least "neutral" vs "smiling" variants
   per scene — celebrate/wave scenes get a bigger smile, idle/boardroom
   scenes get a more neutral expression), optional blush dots.
4. **New animation primitives inspired by the research**: a periodic blink
   (cheap — an eyelid rect that scales to ~0 height on a ~4s loop, very
   high perceived-life-to-effort ratio), refined wave easing using an
   actual cubic-bezier curve (there's already a `CubicBezierEditor` built
   for the CSS Shapes project this session — same underlying easing-curve
   concept applies here, just baked into the keyframe rather than
   user-editable), and keeping loop durations inside the ~3s guidance
   already mostly followed.
5. Clothing (blazer/shirt/tie) gets rebuilt as smooth paths fitted to the
   new torso silhouette instead of layered rectangles, so it doesn't look
   like separate blocks glued onto a rect.

### Feasibility — the real constraint

This is fundamentally a **visual hand-crafting task**, not a logic problem.
Getting bezier-path character silhouettes to look genuinely good requires
iterating against what's actually rendered on screen — nudging control
points, checking proportions, adjusting curves. That loop currently isn't
available to me directly: the Chrome extension has been unreachable all
session, and the dev server on port 3000 is the user's own `pnpm dev`
(intentionally not touched).

Realistic plan for when this is picked back up:

- Build v1 of the new path-based character (one scene, e.g. `wave`, as the
  test case) and get it in front of the user for a screenshot/description
  of what's off, rather than trying to one-shot every scene blind.
- Iterate 2–3 rounds on that one scene until it's approved, _then_ roll the
  approved geometry out across all 7 scenes — cheaper than redesigning per
  scene individually.
- If the Chrome extension reconnects by then, use it directly for
  screenshot-based iteration instead of relying on the user's manual
  feedback loop.

Effort: **large** — this is a genuine illustration-design task wearing
code, not a quick refactor. Should be scoped as its own session, done
scene-by-scene starting with `wave`, not attempted as one big rewrite.

---

## Suggested order when resumed

1. Meta Tag Generator shuffle (Path A) — smaller, self-contained, no visual
   iteration loop needed, can be done and verified in one pass via the
   Node-script testing approach already proven this session.
2. Character rework — start with the `wave` scene only, get explicit
   sign-off on the look before touching the other 6 scenes.
