import roadmapData from "../data/roadmaps/neetcode150.json";

export const CATEGORY_LEVELS: readonly (readonly string[])[] = roadmapData.levels;

export const ROADMAP_POSITIONS: Record<string, { x: number; y: number }> = Object.fromEntries(
  roadmapData.categories.map(({ name, x, y }) => [name, { x, y }]),
);

export const ROADMAP_EDGES: Array<[string, string]> = roadmapData.edges.map(
  ([from, to]) => [from, to],
);
