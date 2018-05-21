export const faWarnIfIconSpecMissing = (iconSpec) => {
  if (!iconSpec) {
    console.error('FontAwesome: Could not find icon. ' +
      `It looks like you've provided a null or undefined icon object to this component.`);
  }
};
