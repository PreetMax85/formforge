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

export const THEME_META: Record<string, { label: string; color: string; bg: string }> = {
  default:               { label: 'Default',             color: '#9ca3af', bg: 'rgba(156,163,175,0.1)'  },
  'ghost-of-tsushima':   { label: 'Ghost of Tsushima', color: '#c8860a', bg: 'rgba(200,134,10,0.1)'   },
  'jujutsu-kaisen':      { label: 'Jujutsu Kaisen',    color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'   },
  'karan-aujla-concert': { label: 'Karan Aujla',       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
  cyberpunk:             { label: 'Cyberpunk',          color: '#ff2d78', bg: 'rgba(255,45,120,0.1)'   },
  matrix:                { label: 'Matrix',             color: '#00cc33', bg: 'rgba(0,204,51,0.1)'     },
  synthwave:             { label: 'Synthwave',          color: '#ff79c6', bg: 'rgba(255,121,198,0.1)'  },
  minimal:               { label: 'Minimal',            color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'   },
};

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
