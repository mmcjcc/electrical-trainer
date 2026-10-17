/** Chapter 9 raceway-fill recipes: same-size conductors (the reference recipe) and a mix of sizes. */
import type { Recipe } from '@/shared/types'
import { sameSizeFill } from './sameSize'
import { mixedFill } from './mixedFill'

export const RACEWAY_RECIPES: Recipe[] = [sameSizeFill, mixedFill]
