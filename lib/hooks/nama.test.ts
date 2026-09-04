import { describe, expect, it } from 'vitest'
import { namaPanggilan } from './index'

describe('nama panggilan', () => {
  const kasus: Array<[string, string]> = [
    ['Ir. Moh. Sahwan', 'Sahwan'],
    ['Moh. Hendra Wijaya', 'Hendra'],
    ['Abd. Rahman', 'Rahman'],
    ['H. Moh. Hasan', 'Hasan'],
    ['Siti Aisyah', 'Aisyah'],
    ['Nur Aini Rahmawati, S.P.', 'Aini'],
    ['Aiptu Abd. Karim', 'Karim'],
    ['Fatimah', 'Fatimah'],
    ['Maya Rosalina', 'Maya'],
    ['Junaidi', 'Junaidi'],
  ]

  it.each(kasus)('%s → %s', (penuh, panggilan) => {
    expect(namaPanggilan(penuh)).toBe(panggilan)
  })

  it('tidak pernah mengembalikan string kosong', () => {
    for (const [penuh] of kasus) {
      expect(namaPanggilan(penuh).length).toBeGreaterThan(0)
    }
  })

  it('bertahan pada nama yang seluruhnya partikel', () => {
    expect(namaPanggilan('Moh.')).toBe('Moh.')
  })
})
