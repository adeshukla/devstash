import { LAUNCH_CHECKLIST } from '@/lib/lab/campaignPack'

/** The same checks the campaign pack carries, on the page where the links are made. */
export function LaunchChecklist() {
  return (
    <details className="border-ds-border rounded-xl border p-4">
      <summary className="text-ds-text cursor-pointer text-sm font-medium">
        Test your links before you launch
      </summary>
      <ol className="text-ds-muted mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
        {LAUNCH_CHECKLIST.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-ds-muted mt-3 text-sm">
        The campaign pack download includes this as a checklist you can tick.
      </p>
    </details>
  )
}
