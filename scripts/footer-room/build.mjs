// Builds the footer scene the site serves (public/images/animations/footer-room.svg)
// from the canvas source, scene.dc.html. The scene's CSS is scoped under .fs-root so
// nothing leaks into the site, its fonts map to the site's next/font variables, and
// the <svg> starts paused (.is-paused) until components/layout/FooterScene.tsx plays it.
//
// Editing the animation: change gen.mjs / rig.html, then
//   node scripts/footer-room/gen.mjs scripts/footer-room/scene.dc.html scripts/footer-room/rig.html
//   node scripts/footer-room/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const here = new URL('.', import.meta.url)
const src = readFileSync(new URL('scene.dc.html', here), 'utf8')
const out = new URL('../../public/images/animations/footer-room.svg', here)

const style = src.match(/<style>([\s\S]*?)<\/style>/)?.[1]
const svg = src.match(/<svg viewBox="0 0 1920 560"[\s\S]*?<\/svg>(?=\s*<\/sc-if>)/)?.[0]
if (!style || !svg) throw new Error('scene.dc.html: <style> or the scene <svg> not found')

const css = style
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^body\{margin:0\}$/m, '')
  .replace(/^\.replay[^\n]*$/gm, '') // the canvas's own Replay button, not shipped
  .replaceAll('.scene svg *', '.fs-root *')
  .replaceAll('.scene svg', '.fs-root')
  .replaceAll('.scene .', '.fs-root .')
  .replaceAll('.still svg *', '.fs-root.is-still *')
  .replaceAll('.still .', '.fs-root.is-still .')
  .replaceAll('.paused svg *', '.fs-root.is-paused *')
  // every remaining rule that starts with a class gets the scope (keyframe steps never start with ".")
  .replace(/(^|[}\n,])(\s*)\.(?!fs-root)(?=[a-zA-Z])/g, '$1$2.fs-root .')
  .replaceAll("'DM Sans',system-ui,sans-serif", 'var(--font-sans),system-ui,sans-serif')
  .replaceAll("'JetBrains Mono',ui-monospace,monospace", 'var(--font-mono),ui-monospace,monospace')
  .replace(/\n{2,}/g, '\n')
  .trim()

const scene = svg.replace(
  /^<svg viewBox="0 0 1920 560" width="1920" height="560"/,
  '<svg xmlns="http://www.w3.org/2000/svg" class="fs-root is-paused" viewBox="0 0 1920 560" preserveAspectRatio="xMidYMid slice"'
)
if (scene === svg) throw new Error('scene <svg> root did not match')
const [open, ...rest] = scene.split(/(?<=^<svg[^>]*>)/)
writeFileSync(out, `${open}\n<style>\n${css}\n</style>\n${rest.join('')}\n`)
console.log(`footer-room.svg: ${(readFileSync(out).length / 1024).toFixed(0)} KB`)
