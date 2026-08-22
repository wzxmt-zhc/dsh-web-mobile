import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COMPAT_CSS } from '../src/client/styles/compat.css.ts'

test('market gallery uses responsive horizontal image items', () => {
  const containerRule = /\[data-mobile-nav="frame"\] \[class\*="cardShots"\] \{([\s\S]*?)\n\}/.exec(COMPAT_CSS)?.[1]
  const itemRule = /\[data-mobile-nav="frame"\] \[class\*="cardShots"\] > \[class\*="cardShot"\] \{([\s\S]*?)\n\}/.exec(COMPAT_CSS)?.[1]

  assert.match(COMPAT_CSS, /^@media \(max-width: 1023px\) \{/)
  assert.ok(containerRule)
  assert.match(containerRule, /flex-wrap: nowrap !important/)
  assert.match(containerRule, /overflow-x: auto !important/)
  assert.ok(itemRule)
  assert.match(itemRule, /flex: 0 0 min\(100%, 420px\) !important/)
  assert.match(itemRule, /width: min\(100%, 420px\) !important/)
  assert.match(itemRule, /object-fit: contain !important/)
  assert.doesNotMatch(itemRule, /width: 180px !important/)
})
