export const FIELD_TYPES = [
  'short_text', 'long_text', 'email', 'number',
  'single_select', 'multi_select', 'checkbox',
  'rating', 'date', 'dropdown',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const THEMES = [
  'default', 'ghost-of-tsushima', 'jujutsu-kaisen',
  'karan-aujla-concert', 'cyberpunk', 'matrix', 'synthwave', 'minimal',
] as const;

export type Theme = (typeof THEMES)[number];

export const FORM_VISIBILITIES = ['public', 'unlisted'] as const;
export type FormVisibility = (typeof FORM_VISIBILITIES)[number];

export const FORM_STATUSES = ['draft', 'published', 'archived'] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const HTTP_STATUS = {
  OK:          200,
  CREATED:     201,
  NO_CONTENT:  204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN:   403,
  NOT_FOUND:   404,
  CONFLICT:    409,
  TOO_MANY:    429,
  INTERNAL:    500,
} as const;
