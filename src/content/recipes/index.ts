/**
 * The recipe registry. Each family folder exports `<FAMILY>_RECIPES` from its index.ts; the
 * ARCHITECT adds the import below. UI imports from '@/content' only.
 */
import type { Recipe, RecipeFamily } from '@/shared/types'
import { sameSizeFill } from './raceway/sameSize'

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

const RECIPES: Recipe[] = [sameSizeFill]

for (const [i, r] of RECIPES.entries()) {
  if (RECIPES.findIndex((x) => x.id === r.id) !== i) throw new Error(`duplicate recipe id ${r.id}`)
}

export function listRecipes(): Recipe[] {
  return [...RECIPES]
}

export function recipesByFamily(family: RecipeFamily): Recipe[] {
  return RECIPES.filter((r) => r.family === family)
}

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id)
}
