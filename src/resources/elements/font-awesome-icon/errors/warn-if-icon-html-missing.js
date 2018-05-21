export const faWarnIfIconHtmlMissing = (iconObj, iconSpec) => {
  if (iconSpec && !iconObj) {
    console.error(`FontAwesome: Could not find icon with iconName=${iconSpec.iconName} and prefix=${iconSpec.prefix}`);
  }
};
