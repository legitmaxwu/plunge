import { LexoRank } from "lexorank";

export function getLexoRankIndices(
  start: string | null,
  count: number
): string[] {
  let indexToAdd = start ? LexoRank.parse(start).genNext() : LexoRank.middle();

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(indexToAdd.toString());
    indexToAdd = indexToAdd.genNext();
  }
  return result;
}

export function getLexoRankIndexBetween(
  first: string | null,
  second: string | null
) {
  if (first && second) {
    return LexoRank.parse(first).between(LexoRank.parse(second)).toString();
  } else if (first) {
    return LexoRank.parse(first).genNext().toString();
  } else if (second) {
    return LexoRank.parse(second).genPrev().toString();
  }
}
