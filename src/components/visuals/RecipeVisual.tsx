/**
 * Picks the recipe's picture by `instance.visual.kind`. Unknown kinds, or data that does not have
 * the expected shape, render nothing. The worksheet decides when it may show (never before the
 * lines it would give away).
 */
import { BoxVisual, boxModel } from './BoxVisual'
import { isLoadData, LoadVisual } from './LoadVisual'
import { RacewayVisual, racewayModel } from './RacewayVisual'

export function RecipeVisual({ visual }: { visual?: Record<string, unknown> }) {
  if (!visual) return null
  const raceway = racewayModel(visual)
  if (raceway) return <RacewayVisual model={raceway} />
  const box = boxModel(visual)
  if (box) return <BoxVisual model={box} />
  if (isLoadData(visual)) return <LoadVisual buckets={visual.buckets} unit={visual.unit} kind="load" />
  return null
}

/** True when RecipeVisual would draw something for this data. */
export function hasVisual(visual?: Record<string, unknown>): boolean {
  return !!visual && (racewayModel(visual) !== null || boxModel(visual) !== null || isLoadData(visual))
}
