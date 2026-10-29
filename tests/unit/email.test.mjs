import test from 'node:test'
import assert from 'node:assert/strict'
import { renderNotificationEmail, escapeHtml } from '../../lib/email/renderNotificationEmail.ts'

const base = {
  icon: '📬',
  heading: 'New contact form submission',
  fields: [
    { label: 'Name', value: '<b>x</b>', section: 'Contact' },
    { label: 'Email', value: 'a@b.co', href: 'mailto:a@b.co' },
  ],
  footerNote: 'note',
}

test('renders badge, buttons and section titles; text version lists the links', () => {
  const { html, text } = renderNotificationEmail({
    ...base,
    badge: { text: 'Hiring', color: '#166534', background: '#dcfce7' },
    actions: [{ label: 'Reply to Asha', href: 'mailto:a@b.co?subject=Re%3A%20Hi', primary: true }],
  })
  assert.match(html, /Hiring/)
  assert.match(html, /Reply to Asha/)
  assert.match(html, />Contact</)
  assert.match(text, /Reply to Asha: mailto:a@b\.co/)
  assert.match(text, /— Contact —/)
})

test('user-supplied field values are escaped', () => {
  const { html } = renderNotificationEmail(base)
  assert.ok(!html.includes('<b>x</b>'))
  assert.equal(escapeHtml('<&">'), '&lt;&amp;&quot;&gt;')
})
