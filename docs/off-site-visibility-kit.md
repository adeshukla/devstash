# Off-site visibility kit

_Prepared 2026-10-17. Companion to [ai-visibility-audit.md](ai-visibility-audit.md)._

Everything on the sites is done; what is left happens on other websites, and
only Adesh can do it (it needs his accounts). Each block below is ready to
paste. Do them in this order: bios first (free, five minutes, and they make
everything after it count), then listings, then cross-posts.

**Rule for all of it:** the same words everywhere. Assistants work out who
you are by seeing the same name + role + site repeated across independent
places. There is a different "adeshshukla" on GitHub (two `s`, one `h` apart
from yours) and several namesakes on LinkedIn, so consistency is the whole
point.

---

## 1. Bios — make all three identical

**Short form** (GitHub bio, X bio, DEV.to bio):

```
UI developer — landing pages, web performance, React/Next.js · devstash.me
```

**LinkedIn headline:**

```
UI Developer · Landing Pages & Web Performance · React/Next.js · devstash.me
```

**Website field** on every profile: `https://devstash.me`

**GitHub:** pin Pare and DevStash (both public), and make sure Pare's README's
first screen links `https://pare.devstash.me` and `https://devstash.me`.

---

## 2. Listings for Pare (highest value)

Assistants answer "best free X" questions mostly from directories and
listicles. Pare is the project most likely to be recommended, so list it
first.

### AlternativeTo — alternativeto.net

List as an alternative to **TinyPNG** and **Squoosh**.

- **Name:** Pare
- **URL:** https://pare.devstash.me
- **License:** Free (proprietary) — _not_ open source; the repo is all rights reserved
- **Platforms:** Online / Web
- **Description:**

```
Pare compresses and converts images, fonts and code entirely in your browser — files are never uploaded, because there is no server. Images come out as AVIF, WebP and an optimized original at several widths, with the <picture> tag ready to paste. It also converts iPhone HEIC photos to JPG, fits an image under a size limit (e.g. 100 KB), makes favicons, subsets fonts to WOFF2, and minifies CSS, JS, HTML and SVG. Free, no account, and each tool keeps working offline once you have used it.
```

- **Tags:** image-compression, image-optimizer, privacy, webp, avif, heic-to-jpg, no-upload

### Product Hunt

- **Name:** Pare
- **Tagline (≤60 chars):** `Shrink images, fonts and code without uploading them`
- **Description:** use the AlternativeTo text above.
- **First comment** (the maker comment people actually read):

```
I built Pare because the usual choice is bad either way: online compressors upload your files and hand back a file with no markup, and build tools need Node and a project setup. Pare runs the real codecs (compiled to WebAssembly) in the browser tab, so nothing leaves your machine, and it gives you the <picture> / @font-face code as well as the files. Drop a whole site folder and it renders every page before and after, and only offers the download if nothing moved.
```

### Free-tool lists

Search GitHub for `awesome image optimization` / `awesome privacy tools` lists
and open a pull request adding one line:

```
- [Pare](https://pare.devstash.me) - Compress and convert images, fonts and code in the browser; nothing is uploaded.
```

Only add it where the list's own rules allow free proprietary web tools.

---

## 3. Cross-post the error-fix posts to DEV.to

These are the posts with the best chance of being cited, because they
answer exact error messages.

1. `/blog/nextjs-16-params-promise-undefined`
2. `/blog/usesearchparams-suspense-boundary-build-error`
3. `/blog/tailwind-v4-classes-not-working`

For each: on DEV.to, create a post, paste the Markdown, and set the canonical
URL in its front matter so Google credits devstash.me, not DEV.to:

```
---
title: <same title>
published: true
tags: nextjs, react, typescript, webdev
canonical_url: https://devstash.me/blog/<slug>
---
```

Replace the in-post relative links (`/blog/...`) with full
`https://devstash.me/blog/...` URLs before publishing.

---

## 4. Answer the matching questions (slowly)

Find the Stack Overflow / GitHub Discussions / Reddit (r/nextjs, r/tailwindcss)
threads asking these exact questions. Answer **in the thread**, fully, and
link the post only as "more detail". One genuine answer a week beats ten link
drops, which get removed and can hurt.

---

## 5. Measure — once a quarter, not weekly

Run the five prompts in section 6 of [ai-visibility-audit.md](ai-visibility-audit.md),
logged out, in ChatGPT, Perplexity, Gemini and Claude. Add these two, now that
the posts exist:

- `Why is params.slug undefined in Next.js 16?`
- `Free image compressor that doesn't upload my files`

Record verbatim whether devstash.me or pare.devstash.me is mentioned, and
whether the description is accurate.
