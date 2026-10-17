/** Electrical-theory recipes: Ohm's law and power, current from kVA/kW, power factor. */
import type { Recipe } from '@/shared/types'
import { ohmsLaw } from './ohmsLaw'
import { threePhaseCurrent } from './threePhase'
import { powerFactor } from './powerFactor'

export const BASICS_RECIPES: Recipe[] = [ohmsLaw, threePhaseCurrent, powerFactor]
