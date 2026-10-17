/**
 * The recipe registry. Each family folder exports `<FAMILY>_RECIPES` from its index.ts; the
 * ARCHITECT adds the import below. UI imports from '@/content' only.
 */
import type { Recipe, RecipeFamily } from '@/shared/types'
import { AMPACITY_RECIPES } from './ampacity'
import { BASICS_RECIPES } from './basics'
import { BOX_RECIPES } from './box'
import { COMMERCIAL_RECIPES } from './commercial'
import { DWELLING_RECIPES } from './dwelling'
import { MOTOR_RECIPES } from './motor'
import { RACEWAY_RECIPES } from './raceway'
import { TRANSFORMER_RECIPES } from './transformer'
import { VDROP_RECIPES } from './vdrop'

export const FAMILY_TITLE: Record<RecipeFamily, string> = {
  basics: "Ohm's law and power",
  dwelling: 'Dwelling load calculations',
  commercial: 'Commercial load calculations',
  raceway: 'Conduit fill',
  box: 'Box fill and pull boxes',
  ampacity: 'Ampacity and overcurrent protection',
  vdrop: 'Voltage drop',
  motor: 'Motors',
  transformer: 'Transformers',
}

/** Display order of the families on the Math home screen (load calcs first: he needs them most). */
export const FAMILY_ORDER: RecipeFamily[] = [
  'dwelling', 'commercial', 'basics', 'ampacity', 'raceway', 'box', 'vdrop', 'motor', 'transformer',
]

const RECIPES: Recipe[] = [
  ...DWELLING_RECIPES, ...COMMERCIAL_RECIPES, ...RACEWAY_RECIPES, ...BOX_RECIPES, ...AMPACITY_RECIPES, ...VDROP_RECIPES, ...MOTOR_RECIPES,
  ...TRANSFORMER_RECIPES, ...BASICS_RECIPES,
]

for (const [i, r] of RECIPES.entries()) {
  if (RECIPES.findIndex((x) => x.id === r.id) !== i) throw new Error(`duplicate recipe id ${r.id}`)
}

/**
 * The learning path: the order a new learner is offered recipes in (Home's "Today", the first
 * suggestion). An easy, familiar one first so he learns how the worksheet works, then the dwelling
 * load calculation built up from its pieces, then the rest by how often the exam uses them. Recipes not
 * listed follow in registry order.
 */
export const RECIPE_PATH = [
  'basics-ohms-law', 'basics-three-phase',
  'dwelling-lighting-demand', 'dwelling-range', 'dwelling-dryers', 'dwelling-appliances', 'dwelling-standard',
  'ampacity-continuous', 'raceway-same-size', 'box-fill', 'dwelling-optional', 'commercial-store',
  'motor-branch', 'ampacity-derate', 'raceway-mixed', 'vdrop-forward', 'transformer', 'dwelling-neutral',
  'multifamily-optional', 'dwelling-ranges-multi', 'motor-feeder', 'commercial-kitchen', 'vdrop-reverse',
  'ampacity-derate-reverse', 'box-pull', 'basics-power-factor',
]

const PATH_ORDER = [...RECIPES].sort((a, b) => {
  const ia = RECIPE_PATH.indexOf(a.id)
  const ib = RECIPE_PATH.indexOf(b.id)
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
})

/** Every recipe, in learning-path order. */
export function listRecipes(): Recipe[] {
  return [...PATH_ORDER]
}

export function recipesByFamily(family: RecipeFamily): Recipe[] {
  return RECIPES.filter((r) => r.family === family)
}

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id)
}
