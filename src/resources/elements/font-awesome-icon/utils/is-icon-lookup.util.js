/**
 * Returns if is IconLookup or not.
 * @returns IconLookup
 */
export const isIconLookup = (i) => {
  return (i).prefix !== undefined && (i).iconName !== undefined;
};
