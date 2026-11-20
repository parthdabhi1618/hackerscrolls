import w1 from '../assets/walls/w1.webp'
import w2 from '../assets/walls/w2.webp'
import w3 from '../assets/walls/w3.webp'
import w4 from '../assets/walls/w4.webp'
import type { WallId } from '../types'

export interface WallDef {
  id: WallId
  name: string
  src?: string
}

/** Wallpaper choices for the backdrop layer. `plain` keeps the ink ambient field. */
export const WALLS: WallDef[] = [
  { id: 'w1', name: 'Silk', src: w1 },
  { id: 'w2', name: 'Magenta', src: w2 },
  { id: 'w3', name: 'Dusk', src: w3 },
  { id: 'w4', name: 'Ember', src: w4 },
  { id: 'plain', name: 'Ink' },
]

export function wallDef(id: WallId): WallDef {
  return WALLS.find((w) => w.id === id) ?? WALLS[0]!
}

export const DEFAULT_WALL: WallId = 'w1'
