export const goalCovers = {
  abstract: {label: 'Abstrata', image: null},
  forest: {label: 'Floresta', image: '/images/prumo-forest.webp'},
  ridge: {label: 'Montanhas', image: '/images/prumo-ridge.webp'},
  lake: {label: 'Lago', image: '/images/prumo-lake.webp'},
  canyon: {label: 'Vale', image: '/images/prumo-canyon.webp'},
  river: {label: 'Rio', image: '/images/prumo-river.webp'},
} as const;

export type GoalCover = keyof typeof goalCovers;
export const maxFeaturedGoals = 3;
export const isGoalCover = (value: unknown): value is GoalCover =>
  typeof value === 'string' && Object.hasOwn(goalCovers, value);
