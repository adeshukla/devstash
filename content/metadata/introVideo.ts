// The 81-second DevStash intro reel (made in Desktop/devstash-video with Remotion; captions are
// burned in). Shared by the player, the pages that show it, and the VideoObject JSON-LD.
export const INTRO_VIDEO = {
  src: '/video/devstash-intro.mp4',
  poster: '/video/devstash-intro-poster.jpg',
  width: 1280,
  height: 720,
  durationSeconds: 81,
  title: 'DevStash in 80 seconds — Adesh Shukla, UI developer',
  description:
    'A narrated tour of what Adesh Shukla builds: Pare, Build Components, Praxis, Motion Lab and the AI content pipeline — fast, accessible, honest web work.',
  uploadDate: '2026-10-22',
  /** The builds the video walks through, in its order, each with the line it
   *  says about them — from devstash-video/src/script.ts. Shown on the poster.
   *  `slug` picks the logo (components/icons/ProjectMark.tsx). */
  chapters: [
    { slug: 'pare', name: 'Pare', line: 'Shrinks images, fonts and code in your browser' },
    {
      slug: 'build-components',
      name: 'Build Components',
      line: '137 accessible UI parts, as plain code',
    },
    { slug: 'praxis', name: 'Praxis', line: 'Interview prep with an AI that keeps asking why' },
    { slug: 'motion-lab', name: 'Motion Lab', line: '17 landing pages, one performance budget' },
    {
      slug: 'ai-content-pipeline',
      name: 'AI content pipeline',
      line: 'Edits out clichés, refuses to invent facts',
    },
  ],
} as const
