# Ship-gate learnings

Issue classes found by pre-production gates. Check these first next time.

## 2026-11-22 (dev to main, 31 commits)

- **Measure LCP for real, not only in Lighthouse's simulator.** Simulated mobile LCP moved by up to 1 s
  between builds with no real cause (same render-blocking files, same real timings). A throttled
  Chrome run (4x CPU, slow 4G, 9-12 runs, `PerformanceObserver` for `largest-contentful-paint`)
  showed home and UTM builder identical to `main`. Use both; trust the real one.
- **A client-only banner can become the LCP element.** The cookie banner's paragraph painted after
  hydration and, on pages whose own LCP candidate is small (blog posts), became the LCP. Showing it
  on first scroll/tap/key (or after 10 s) fixes it: Chrome stops counting candidates at first input.
  A fixed delay (1.5 s) made it worse in some runs. Check any new fixed or late-mounted text block.
- **Stale servers invalidate results.** Rebuilding while an old `next start` still ran on the port
  served mismatched files; a second `next start` silently failed with EADDRINUSE. Stop the old
  process tree first, start the new one with `run_in_background`, and confirm the log has no
  `EADDRINUSE` before measuring. `netstat | grep LISTENING` showed nothing in this environment;
  find processes with `Get-CimInstance Win32_Process` instead.
- **QA that passes locally can race under load.** `lab.spec.ts` "a picture gives the style" polled
  for a state that is true both before and after the click, then asserted immediately. Poll on the
  thing that actually changes. Repeat suspect tests with `--repeat-each=10 --workers=4`.
- **`main` could not be rebuilt.** Next.js 16.4.3 now fails `next build` with a security advisory
  (SecurityFatalError). Any redeploy of `main` before the 16.4.6 bump fails. Check that `main`
  builds, not only `dev`.
- **Tests that post to an API need the same env as CI.** With reCAPTCHA keys in `.env.local`, API tests
  that post without a token get 403. Run those with the keys unset, as CI does.
- **Port 3000 may be another project.** The default QA config reuses whatever is on :3000 (it was
  Praxis). Run QA with `QA_BASE_URL` pointing at DevStash's own server.
