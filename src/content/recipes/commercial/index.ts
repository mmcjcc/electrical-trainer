/** Commercial (non-dwelling) load-calculation recipes (Article 220, 2020 NEC). */
import type { Recipe } from '@/shared/types'
import { commercialKitchen } from './kitchen'
import { commercialStore } from './store'

export const COMMERCIAL_RECIPES: Recipe[] = [commercialStore, commercialKitchen]
