'use client'

import { useId } from 'react'
import { FONTS, safeHex, type FontId, type TextEl } from '@/lib/lab/ogImage'

const field =
  'border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border px-3 py-2 text-sm outline-none'

export const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

/** A group of controls that opens and closes. */
export function Section({
  title,
  hint,
  open = false,
  tour,
  children,
}: {
  title: string
  hint?: string
  open?: boolean
  /** Name the guided tour uses to find this section. */
  tour?: string
  children: React.ReactNode
}) {
  return (
    <details open={open} data-tour={tour} className="border-ds-border group rounded-xl border">
      <summary className="text-ds-text hover:text-ds-accent flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
        <span>
          {title}
          {hint && <span className="text-ds-muted ml-2 text-xs font-normal">{hint}</span>}
        </span>
        <span
          aria-hidden="true"
          className="text-ds-muted transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="border-ds-border flex flex-col gap-4 border-t p-4">{children}</div>
    </details>
  )
}

export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-ds-text text-[13px] font-medium">
          {label}
        </label>
        <span className="text-ds-muted font-mono text-xs">
          {Math.round(value * 100) / 100}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-ds-accent w-full"
      />
    </div>
  )
}

/** A colour picker with its hex value. With `allowEmpty`, blank means "use the theme's colour". */
export function ColorField({
  label,
  value,
  fallback,
  onChange,
  allowEmpty = false,
}: {
  label: string
  value: string
  fallback: string
  onChange: (v: string) => void
  allowEmpty?: boolean
}) {
  const id = useId()
  const shown = safeHex(value, fallback)
  return (
    <div>
      <label htmlFor={id} className="text-ds-text mb-1 block text-[13px] font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={shown.length === 4 ? `#${shown.slice(1).replace(/./g, '$&$&')}` : shown}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer"
        />
        <input
          aria-label={`${label}, hex value`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowEmpty ? `Theme (${fallback})` : fallback}
          spellCheck={false}
          className={`${field} font-mono`}
        />
        {allowEmpty && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="border-ds-border text-ds-muted hover:text-ds-text hover:border-ds-accent shrink-0 rounded-lg border px-2.5 py-2 text-xs"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="text-ds-text mb-1.5 text-[13px] font-medium">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={chip(value === o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="text-ds-text flex items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-ds-accent h-4 w-4"
      />
      {label}
    </label>
  )
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-ds-text mb-1 block text-[13px] font-medium">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        {options.map((o) => (
          <option key={String(o.id)} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export const WEIGHTS = [
  { id: 300, label: 'Light' },
  { id: 400, label: 'Regular' },
  { id: 500, label: 'Medium' },
  { id: 600, label: 'Semibold' },
  { id: 700, label: 'Bold' },
  { id: 800, label: 'Extra bold' },
  { id: 900, label: 'Black' },
]

/** Everything that can be set on one piece of text. */
export function TextControls({
  label,
  el,
  onChange,
  multiline = false,
  hasLeading = false,
  defaultColorName,
  defaultColor,
  sizeLabel,
  sizeMin,
  sizeMax,
  placeholder,
}: {
  label: string
  el: TextEl
  onChange: (patch: Partial<TextEl>) => void
  multiline?: boolean
  hasLeading?: boolean
  defaultColorName: string
  defaultColor: string
  sizeLabel: string
  sizeMin: number
  sizeMax: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor={id} className="text-ds-text mb-1 block text-[13px] font-medium">
          {label}
        </label>
        {multiline ? (
          <textarea
            id={id}
            rows={2}
            maxLength={200}
            value={el.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={placeholder}
            className={`${field} resize-y`}
          />
        ) : (
          <input
            id={id}
            maxLength={120}
            value={el.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={placeholder}
            autoComplete="off"
            className={field}
          />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={`${label} font`}
          value={el.font}
          options={(Object.keys(FONTS) as FontId[]).map((f) => ({ id: f, label: FONTS[f].label }))}
          onChange={(v) => onChange({ font: v as FontId })}
        />
        <SelectField
          label={`${label} weight`}
          value={el.weight}
          options={WEIGHTS}
          onChange={(v) => onChange({ weight: Number(v) })}
        />
        <Range
          label={`${label}, ${sizeLabel}`}
          value={el.size}
          min={sizeMin}
          max={sizeMax}
          step={0.1}
          unit="%"
          onChange={(v) => onChange({ size: v })}
        />
        <Range
          label={`${label} opacity`}
          value={el.opacity}
          min={10}
          max={100}
          unit="%"
          onChange={(v) => onChange({ opacity: v })}
        />
        <Range
          label={`${label} letter spacing`}
          value={el.spacing}
          min={-8}
          max={30}
          onChange={(v) => onChange({ spacing: v })}
        />
        {hasLeading && (
          <Range
            label={`${label} line height`}
            value={el.leading}
            min={0.9}
            max={1.8}
            step={0.01}
            onChange={(v) => onChange({ leading: v })}
          />
        )}
      </div>
      <ColorField
        label={`${label} colour`}
        value={el.color}
        fallback={defaultColor}
        allowEmpty
        onChange={(v) => onChange({ color: v })}
      />
      <p className="text-ds-muted -mt-2 text-xs">Empty uses the {defaultColorName} colour.</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Toggle
          label={`${label} in capitals`}
          checked={el.upper}
          onChange={(v) => onChange({ upper: v })}
        />
        <Toggle
          label={`${label} in italics`}
          checked={el.italic}
          onChange={(v) => onChange({ italic: v })}
        />
      </div>
    </div>
  )
}

/** One plain text box, for the simple view. */
export function PlainText({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-ds-text mb-1 block text-[13px] font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${field} resize-y`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={field}
        />
      )}
    </div>
  )
}
