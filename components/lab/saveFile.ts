interface SaveHandle {
  createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>
}
type SavePicker = (opts: {
  suggestedName: string
  types: { description: string; accept: Record<string, string[]> }[]
}) => Promise<SaveHandle>

/**
 * Opens the system "Save as" dialog where the browser has one (Chrome, Edge,
 * Opera) so the user picks the folder. Firefox and Safari have no such API and
 * fall back to a normal download.
 */
export async function saveBlob(blob: Blob, name: string) {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  if (picker) {
    try {
      const ext = name.slice(name.lastIndexOf('.'))
      const handle = await picker({
        suggestedName: name,
        types: [
          { description: ext.slice(1).toUpperCase() + ' file', accept: { [blob.type]: [ext] } },
        ],
      })
      const file = await handle.createWritable()
      await file.write(blob)
      await file.close()
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // user cancelled
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}
