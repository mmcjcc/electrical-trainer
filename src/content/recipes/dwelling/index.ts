/** Dwelling load-calculation recipes (Article 220, 2020 NEC). */
import type { Recipe } from '@/shared/types'
import { dwellingAppliances } from './appliances'
import { multifamilyOptional } from './multifamily'
import { dwellingDryers } from './dryers'
import { dwellingLightingDemand } from './lighting'
import { dwellingNeutral } from './neutral'
import { dwellingOptional } from './optional'
import { dwellingRange } from './range'
import { dwellingRangesMulti } from './rangesMulti'
import { dwellingStandard } from './standard'

export const DWELLING_RECIPES: Recipe[] = [
  dwellingStandard, dwellingLightingDemand, dwellingRange, dwellingRangesMulti, dwellingDryers, dwellingAppliances, dwellingNeutral, dwellingOptional, multifamilyOptional,
]
