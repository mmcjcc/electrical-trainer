/** Box recipes: 314.16 box fill and 314.28 pull boxes. */
import type { Recipe } from '@/shared/types'
import { boxFill } from './boxFill'
import { pullBox } from './pullBox'

export const BOX_RECIPES: Recipe[] = [boxFill, pullBox]
