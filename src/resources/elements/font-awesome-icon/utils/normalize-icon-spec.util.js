import { isIconLookup } from './is-icon-lookup.util';

/**
 * Normalizing icon spec.
 * @returns IconLookup
 */
export const faNormalizeIconSpec = (iconSpec) => {
  const defaultPrefix = 'fas';

  if (typeof iconSpec === 'undefined' || iconSpec === null) {
    return null;
  }

  try {
    iconSpec = JSON.parse(iconSpec.replace(/'/g, '"'));
  } catch (e) {
    // Oh well, but whatever...
  }

  if (isIconLookup(iconSpec)) {
    return iconSpec;
  }

  if (typeof iconSpec === 'string') {
    if (iconSpec.indexOf(',') > -1) {
      iconSpec = iconSpec.split(',');
    } else {   
      return { prefix: defaultPrefix, iconName: iconSpec };
    }
  }

  if (Array.isArray(iconSpec) && (iconSpec).length === 2) {
    return { prefix: iconSpec[0], iconName: iconSpec[1] };
  }
};
