import { test, expect } from '@playwright/test'

/**
 * Blog tables: every cell in a row gets its bottom line (only the last ROW loses it), and a
 * narrow phone scrolls the table instead of splitting ordinary words in the cells.
 */
test('blog tables keep their row lines and their words', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/blog/qr-codes-that-never-expire-static-vs-dynamic')
  const table = page.locator('article table').first()
  await expect(table).toBeVisible()
  const result = await table.evaluate((t) => {
    const rows = [...t.querySelectorAll('tbody tr')]
    const lastRow = rows[rows.length - 1]
    const bottoms = rows.map((r) =>
      [...r.querySelectorAll('td')].map((td) => getComputedStyle(td).borderBottomWidth)
    )
    return {
      wrap: [...t.querySelectorAll('td,th')].map((c) => getComputedStyle(c).overflowWrap),
      middleRowsAllLined: rows
        .filter((r) => r !== lastRow)
        .every((r) =>
          [...r.querySelectorAll('td')].every(
            (td) => getComputedStyle(td).borderBottomWidth !== '0px'
          )
        ),
      lastRowBottoms: bottoms[bottoms.length - 1],
    }
  })
  expect(new Set(result.wrap)).toEqual(new Set(['normal']))
  expect(result.middleRowsAllLined).toBe(true)
  expect(new Set(result.lastRowBottoms)).toEqual(new Set(['0px']))
})
