/** Ampacity and overcurrent-protection recipes (310.16, 310.15, 110.14(C), 240.4, 240.6, 210.19/210.20). */
import type { Recipe } from '@/shared/types'
import { continuousLoad } from './continuous'
import { derateAmpacity } from './derate'
import { derateReverse } from './derateReverse'

export const AMPACITY_RECIPES: Recipe[] = [continuousLoad, derateAmpacity, derateReverse]
