/**
 * The drills: short no-worksheet rounds. Number drills live in ./numberDrills.ts (MATH UI builder);
 * the find-it-in-the-book drill lives in ./findIt.ts (FACTS builder), re-exported here as it asks.
 */
export {
  NUMBER_DRILLS, getNumberDrill, checkDrillAnswer, ROUND_SIZE, ROUND_SECONDS, STRATEGY_FACTS, isStandardOcpd,
  type Drill, type DrillId, type DrillItem, type DrillVerdict,
} from './numberDrills'
export { findItRound, FIND_IT_DRILL, type FindItItem, type FindItRound, type FindItEntry } from './findIt'
