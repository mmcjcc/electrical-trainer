/** Voltage-drop recipes (the K formula with Chapter 9, Table 8), forward and reverse. */
import type { Recipe } from '@/shared/types'
import { vdropForward } from './vdrop'
import { vdropReverse } from './vdropReverse'

export const VDROP_RECIPES: Recipe[] = [vdropForward, vdropReverse]
