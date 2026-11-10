'use client'

export interface TabDef<T extends string> {
  id: T
  label: string
}

const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`

/** Spread onto the element that holds the selected tab's content. */
export function tabPanelProps(prefix: string, selected: string) {
  return {
    role: 'tabpanel' as const,
    id: `${prefix}-panel`,
    'aria-labelledby': tabId(prefix, selected),
  }
}

/**
 * Tabs that behave the way screen-reader and keyboard users expect: only the selected tab is in
 * the Tab order, the arrow keys move between tabs (Home and End jump to the first and last), and
 * each tab points at the panel it controls. Pair it with `tabPanelProps` on the content.
 */
export function TabList<T extends string>({
  tabs,
  value,
  onChange,
  label,
  prefix,
}: {
  tabs: TabDef<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  /** Unique on the page; builds the ids that tie the tabs to their panel. */
  prefix: string
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === value)
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight'
        ? i === last
          ? 0
          : i + 1
        : e.key === 'ArrowLeft'
          ? i === 0
            ? last
            : i - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    requestAnimationFrame(() => document.getElementById(tabId(prefix, tabs[next].id))?.focus())
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            id={tabId(prefix, t.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${prefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={
              active
                ? 'border-ds-accent text-ds-text rounded-full border px-3.5 py-1.5 text-sm font-medium'
                : 'border-ds-border text-ds-muted hover:text-ds-text rounded-full border px-3.5 py-1.5 text-sm'
            }
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
