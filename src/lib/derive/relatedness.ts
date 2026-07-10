import { needsAttentionRank } from "./sort";
import type { DerivedProject } from "./types";

export type RelatednessContext = {
  /** projectId → projectIds connected by an explicit relation (either direction, any type) */
  relations: Map<string, Set<string>>;
  /** projectId → facet tagIds (tags belonging to a tag group; free tags don't count) */
  facetTags: Map<string, Set<string>>;
  /** projectId → personIds (lead + every stage owner) */
  people: Map<string, Set<string>>;
};

const WEIGHT_RELATION = 3;
const WEIGHT_FACET_TAG = 2;
const WEIGHT_PERSON = 1;

function intersectionSize(a: Set<string> | undefined, b: Set<string> | undefined): number {
  if (!a || !b) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function relatednessScore(a: string, b: string, ctx: RelatednessContext): number {
  const related = ctx.relations.get(a)?.has(b) ? 1 : 0;
  return (
    WEIGHT_RELATION * related +
    WEIGHT_FACET_TAG * intersectionSize(ctx.facetTags.get(a), ctx.facetTags.get(b)) +
    WEIGHT_PERSON * intersectionSize(ctx.people.get(a), ctx.people.get(b))
  );
}

/**
 * Orders a folder section so related projects sit next to each other:
 * pinned first, then by summed pairwise relatedness to the rest of the
 * section (descending), tie-broken by needs-attention rank.
 */
export function orderFolderSection(projects: DerivedProject[], ctx: RelatednessContext): DerivedProject[] {
  const summed = new Map<string, number>();
  for (const p of projects) {
    let total = 0;
    for (const q of projects) if (q.id !== p.id) total += relatednessScore(p.id, q.id, ctx);
    summed.set(p.id, total);
  }
  return [...projects].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const dr = (summed.get(b.id) ?? 0) - (summed.get(a.id) ?? 0);
    if (dr !== 0) return dr;
    return needsAttentionRank(a.displayHealth) - needsAttentionRank(b.displayHealth);
  });
}
