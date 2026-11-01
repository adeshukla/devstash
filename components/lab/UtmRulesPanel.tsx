'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { trackLab } from './track'
import {
  channelLines,
  patternError,
  patternExample,
  parseChannelLines,
  rulesActive,
  rulesVersion,
  MAX_RULE_CHANNELS,
  type UtmRules,
} from '@/lib/lab/utmRules'
import type { Separator } from '@/lib/lab/utm'

/**
 * Team rules: the channels people may pick and the separator they must use.
 * Nothing is stored on a server; the rules live in this browser and in a link
 * you send to your team. Also holds the "owner" that is written into exports.
 */
export function UtmRulesPanel({
  rules,
  owner,
  onApply,
  onOff,
  onOwner,
  getLink,
}: {
  rules: UtmRules
  owner: string
  onApply: (rules: UtmRules) => void
  onOff: () => void
  onOwner: (owner: string) => void
  getLink: () => string
}) {
  const [text, setText] = useState(() => channelLines(rules.channels))
  const [separator, setSeparator] = useState<Separator>(rules.separator)
  const [pattern, setPattern] = useState(rules.pattern ?? '')
  const [patternProblem, setPatternProblem] = useState('')
  const [errors, setErrors] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const active = rulesActive(rules)

  function apply() {
    const parsed = parseChannelLines(text)
    setErrors(parsed.errors.map((e) => e.line))
    // Apply only a clean list: applying changes the key and would wipe the error message.
    const problem = patternError(pattern)
    setPatternProblem(problem)
    if (parsed.errors.length || !parsed.channels.length || problem) return
    onApply({
      channels: parsed.channels,
      separator,
      ...(pattern.trim() && { pattern: pattern.trim() }),
    })
    setText(channelLines(parsed.channels))
  }

  async function copyLink() {
    if (!(await copyText(getLink()))) return
    trackLab('utm-builder', 'copy_rules_link')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <details className="border-ds-border rounded-xl border p-4" open={active || undefined}>
      <summary className="text-ds-text cursor-pointer text-sm font-medium">
        Working in a team? Set naming rules
        {active && (
          <span className="text-ds-success ml-2 font-mono text-xs">
            on · v{rulesVersion(rules)} · {rules.channels.length} channels
          </span>
        )}
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <p className="text-ds-muted text-sm">
          Lock the form to your approved channels and one word separator, so everyone tags the same
          way. Send the rules link to your team; nothing is stored on a server.
        </p>

        <div>
          <label
            htmlFor="utm-rule-channels"
            className="text-ds-text mb-1.5 block text-[13px] font-medium"
          >
            Approved channels, one per line: name, source, medium
          </label>
          <textarea
            id="utm-rule-channels"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              'Google Ads, google, cpc\nNewsletter, newsletter, email\nPartner posts, acme, referral'
            }
            className="border-ds-border bg-ds-surface2 text-ds-text focus-visible:ring-ds-accent w-full rounded-lg border p-3 font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
          />
          <p className="text-ds-muted mt-1 text-xs">Up to {MAX_RULE_CHANNELS} channels.</p>
          {errors.length > 0 && (
            <p className="text-ds-warning-strong mt-1 text-sm" role="alert">
              {errors.length === 1 ? 'Line' : 'Lines'} {errors.join(', ')} need three parts: name,
              source, medium.
            </p>
          )}
        </div>

        <fieldset className="min-w-0">
          <legend className="text-ds-text mb-1.5 text-[13px] font-medium">
            Between words in campaign names
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(['-', '_'] as const).map((s) => (
              <label key={s} className="text-ds-text flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="utm-separator"
                  checked={separator === s}
                  onChange={() => setSeparator(s)}
                />
                {s === '-' ? 'Hyphen (spring-sale)' : 'Underscore (spring_sale)'}
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label="Campaign name pattern (optional)"
          placeholder="{name}-{yyyy}-{mm}"
          value={pattern}
          maxLength={60}
          onChange={(e) => {
            setPattern(e.target.value)
            setPatternProblem('')
          }}
          error={patternProblem}
          hint={
            pattern.trim() && !patternError(pattern)
              ? `Names must look like ${patternExample(pattern, separator, new Date())}. Parts: {name}, {yyyy}, {mm}, {dd}, {n}.`
              : 'Parts: {name}, {yyyy}, {mm}, {dd}, {n}. Names that do not fit are flagged, not blocked.'
          }
        />

        <Input
          label="Your name or team (added to exports)"
          placeholder="e.g. Priya, Paid team"
          value={owner}
          maxLength={40}
          onChange={(e) => onOwner(e.target.value)}
          hint="Saved on this device. It goes into the owner column so you know who made each link."
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={apply}>
            {active ? 'Update rules' : 'Turn on rules'}
          </Button>
          {active && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy rules link'}</span>
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onOff}>
                Turn off
              </Button>
            </>
          )}
        </div>
      </div>
    </details>
  )
}
