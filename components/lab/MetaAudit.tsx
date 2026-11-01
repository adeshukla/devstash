'use client'

import { useMemo, useState } from 'react'
import { auditHead } from '@/lib/lab/metaAudit'
import { trackLab } from './track'

const EXAMPLE = `<head>
  <title>Home</title>
  <meta name="description" content="Welcome to our site." />
  <meta property="og:title" content="Home" />
  <meta property="og:image" content="/images/share.png" />
</head>`

/**
 * Paste the head of an existing page and see what is missing, too long or
 * repeated. Runs in the browser; nothing is sent anywhere.
 */
export function MetaAudit() {
  const [text, setText] = useState('')
  const result = useMemo(() => auditHead(text), [text])
  const problems = result.issues.filter((i) => i.level === 'problem').length
  const tips = result.issues.length - problems

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="meta-audit" className="text-ds-text mb-1.5 block text-[13px] font-medium">
          Paste your page&apos;s head tags
        </label>
        <textarea
          id="meta-audit"
          rows={7}
          value={text}
          onChange={(e) => {
            if (!text && e.target.value) trackLab('meta-tags', 'audit_paste')
            setText(e.target.value)
          }}
          placeholder="Open your page, view the source, and copy everything between <head> and </head>."
          className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed outline-none"
        />
        {!text && (
          <button
            type="button"
            onClick={() => setText(EXAMPLE)}
            className="text-ds-accent-strong mt-2 text-sm hover:underline"
          >
            Not sure? Try an example
          </button>
        )}
      </div>

      {text.trim() && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="text-ds-text font-medium">
            {problems ? `${problems} problem${problems === 1 ? '' : 's'}` : 'No problems found'}
            {tips > 0 && `, ${tips} tip${tips === 1 ? '' : 's'}`}
          </p>
          {result.issues.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-sm">
              {result.issues.map((i) => (
                <li
                  key={i.text}
                  className={i.level === 'problem' ? 'text-ds-warning-strong' : 'text-ds-muted'}
                >
                  <strong className="font-semibold">
                    {i.level === 'problem' ? 'Problem: ' : 'Tip: '}
                  </strong>
                  {i.text}
                </li>
              ))}
            </ul>
          )}
          {result.found.length > 0 && (
            <details>
              <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm">
                What we read ({result.found.length})
              </summary>
              <ul className="text-ds-muted mt-2 flex flex-col gap-1 font-mono text-xs break-all">
                {result.found.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
