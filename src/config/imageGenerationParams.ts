/**
 * Image Generation Technical Parameters Configuration
 *
 * Optimized parameters for different project types to prevent model saturation
 * and ensure high-quality, consistent image generation.
 *
 * Based on best practices for Stable Diffusion and similar models:
 * - Sampler: DPM++ 2M Karras or Euler a (most stable)
 * - Steps: 20-30 (sweet spot - more can deform images)
 * - CFG Scale: 7-8 (guidance strength)
 */

export interface ImageGenerationParams {
  sampler: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  negative_prompt: string;
}

/**
 * STORYBOARD PARAMETERS
 * Optimized for rough pencil sketch style
 * - Lower steps to maintain sketch quality
 * - Moderate CFG to avoid over-rendering
 * - Negative prompt prevents color, shading, and realism
 */
export const STORYBOARD_PARAMS: ImageGenerationParams = {
  sampler: 'DPM++ 2M Karras', // Alternative: 'Euler a'
  steps: 25, // Optimal range: 20-30 (prevents over-rendering)
  cfg_scale: 7, // Moderate guidance - not too strict
  width: 768,
  height: 512, // Landscape for storyboard panels
  negative_prompt: [
    'color',
    'colored',
    'shading',
    'shadows',
    'rendering',
    'rendered',
    'photorealistic',
    'photo',
    'detailed texture',
    'polished',
    'finished',
    'clean lines',
    'digital art',
    'painting',
    'watercolor',
    'oil painting'
  ].join(', ')
};

/**
 * MINIWORLD PARAMETERS
 * Optimized for isometric diorama style
 * - Higher steps for clean isometric geometry
 * - Higher CFG to maintain isometric perspective
 * - Negative prompt prevents perspective distortion and harsh lighting
 */
export const MINIWORLD_PARAMS: ImageGenerationParams = {
  sampler: 'DPM++ 2M Karras', // Best for architectural/isometric
  steps: 30, // Slightly higher for precise geometry
  cfg_scale: 8, // Stronger guidance to maintain isometric view
  width: 768,
  height: 768, // Square format for isometric
  negative_prompt: [
    'perspective distortion',
    'realistic photography',
    'photographic',
    'harsh shadows',
    'dramatic lighting',
    'dark shadows',
    'cluttered',
    'messy',
    'chaotic',
    'unorganized',
    'realistic render',
    'hyper-realistic',
    'dramatic angle',
    'wide angle',
    'fish eye',
    'distorted'
  ].join(', ')
};

/**
 * ALTERNATIVE SAMPLERS
 * For experimentation or fallback options
 */
export const ALTERNATIVE_SAMPLERS = {
  euler_a: 'Euler a', // Fast, good for sketches
  dpm_2m_karras: 'DPM++ 2M Karras', // Stable, recommended
  dpm_sde_karras: 'DPM++ SDE Karras', // High quality but slower
  heun: 'Heun', // Very precise but slow
  ddim: 'DDIM' // Fast but lower quality
};

/**
 * STEP RECOMMENDATIONS
 * Based on desired quality vs speed tradeoff
 */
export const STEP_RECOMMENDATIONS = {
  quick: 15, // Fast preview (may have artifacts)
  balanced: 25, // Recommended default
  quality: 30, // High quality (diminishing returns after this)
  maximum: 40 // Not recommended - can deform images
};

/**
 * CFG SCALE GUIDE
 * Controls how closely the model follows the prompt
 */
export const CFG_SCALE_GUIDE = {
  loose: 5, // More creative freedom, may deviate
  moderate: 7, // Balanced - recommended for most cases
  strict: 9, // Very close to prompt, less variation
  maximum: 12 // Can create artifacts, not recommended
};

/**
 * Get parameters for a specific project type
 */
export function getImageGenerationParams(
  projectType: 'storyboard' | 'miniworld'
): ImageGenerationParams {
  switch (projectType) {
    case 'storyboard':
      return STORYBOARD_PARAMS;
    case 'miniworld':
      return MINIWORLD_PARAMS;
    default:
      return STORYBOARD_PARAMS;
  }
}

/**
 * Merge custom parameters with defaults
 * Useful for user overrides or experimentation
 */
export function mergeParams(
  baseParams: ImageGenerationParams,
  customParams: Partial<ImageGenerationParams>
): ImageGenerationParams {
  return {
    ...baseParams,
    ...customParams
  };
}

/**
 * Validate parameters to prevent common errors
 */
export function validateParams(params: ImageGenerationParams): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check steps
  if (params.steps < 15) {
    warnings.push('Steps below 15 may produce low-quality images');
  } else if (params.steps > 40) {
    warnings.push('Steps above 40 can deform images and waste time');
  }

  // Check CFG scale
  if (params.cfg_scale < 5) {
    warnings.push('CFG scale below 5 may ignore prompt');
  } else if (params.cfg_scale > 12) {
    warnings.push('CFG scale above 12 can create artifacts');
  }

  // Check dimensions
  if (params.width % 64 !== 0 || params.height % 64 !== 0) {
    warnings.push('Dimensions should be multiples of 64 for optimal generation');
  }

  if (params.width > 1024 || params.height > 1024) {
    warnings.push('Large dimensions may cause out-of-memory errors');
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}
