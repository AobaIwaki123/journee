/**
 * Phase 11.3: プロンプトテンプレート管理
 */

export { GATHERING_PROMPTS } from './gathering';
export { SKELETON_PROMPTS } from './skeleton';
export { DETAILING_PROMPTS } from './detailing';
export { REVIEW_PROMPTS } from './review';

export const PROMPT_TEMPLATES = {
  gathering: GATHERING_PROMPTS,
  skeleton: SKELETON_PROMPTS,
  detailing: DETAILING_PROMPTS,
  review: REVIEW_PROMPTS,
};
