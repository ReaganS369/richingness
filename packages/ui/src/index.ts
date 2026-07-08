// Main entry point for @repo/ui primitive exports.
export const UI_VERSION = '0.0.0';
export const UI_LIBRARY = 'richingness-components';
export const getLibraryMetadata = () => {
  return {
    library: UI_LIBRARY,
    version: UI_VERSION
  };
};
export default getLibraryMetadata;
