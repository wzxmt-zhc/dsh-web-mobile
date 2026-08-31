import type { ReconcilerTask } from '../core/reconciler-core.ts'

export function createGitChipTask(): ReconcilerTask {
  return {
    name: 'git-chip-reparent',
    scopes: ['*'],
    ensure: () => {
      const chip = document.querySelector('[data-slot="conversation.input.dock"] [data-gitgraph-chip-anchor]')
      if (chip === null) return
      // Composer card lookup must cover both DSH 0.1.1-rc.2 (<textarea>) and
      // 0.1.2-alpha.1 (<div contentEditable data-composer-input>) input DOMs.
      const card = document.querySelector('[data-composer-input], textarea')?.closest('[class*="_card"]')
      if (card == null) return
      if (chip.parentElement !== card) card.insertBefore(chip, card.firstChild)
    },
    dispose: () => {
      const chip = document.querySelector('[data-slot="conversation.input.dock"] [data-gitgraph-chip-anchor]')
      const dock = document.querySelector('[data-slot="conversation.input.dock"]')
      if (chip !== null && dock !== null && chip.parentElement !== dock) dock.appendChild(chip)
    },
  }
}
