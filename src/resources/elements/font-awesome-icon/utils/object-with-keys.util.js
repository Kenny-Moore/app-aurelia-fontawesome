/**
 * @param T value
 */
export const objectWithKey = (key, value) => {
  return (Array.isArray(value) && value.length > 0) || (!Array.isArray(value) && value) ? { [key]: value } : {};
};
