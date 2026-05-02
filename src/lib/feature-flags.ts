/**
 * Feature Flags Configuration
 *
 * This file centralizes all feature flags for the application.
 * In a production environment, these could be fetched from a remote config service
 * (like LaunchDarkly, Vercel Edge Config, or a custom API).
 */

export const FEATURE_FLAGS = {
  // Performance optimizations
  DYNAMIC_HOME_SECTIONS: process.env.NEXT_PUBLIC_FF_DYNAMIC_HOME === 'true',
  OPTIMIZED_IMAGES_V2: process.env.NEXT_PUBLIC_FF_IMAGE_V2 === 'true',

  // UI/UX Refinements
  ACCESSIBILITY_ENHANCEMENTS: process.env.NEXT_PUBLIC_FF_A11Y === 'true',
  REDUCED_MOTION_SUPPORT: process.env.NEXT_PUBLIC_FF_REDUCED_MOTION === 'true',

  // Experimental
  STRICT_TYPE_CHECKING: process.env.NEXT_PUBLIC_FF_STRICT_TYPES === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
