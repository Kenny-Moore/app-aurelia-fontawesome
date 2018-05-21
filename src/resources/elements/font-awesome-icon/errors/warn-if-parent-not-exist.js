/**
 * Warns if parent component not existing.
 */
export const faWarnIfParentNotExist = (parent, parentName, childName) => {
  if (!parent) {
    console.error(`FontAwesome: ${childName} should be used as child of ${parentName} only.`);
  }
};
