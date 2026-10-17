/** Article 430 motor recipes: one motor's branch circuit, and several motors on a feeder. */
import type { Recipe } from '@/shared/types'
import { motorBranch } from './motorBranch'
import { motorFeeder } from './motorFeeder'

export const MOTOR_RECIPES: Recipe[] = [motorBranch, motorFeeder]
