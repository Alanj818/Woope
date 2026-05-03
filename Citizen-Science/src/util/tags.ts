// Used by HomeScreen (filter chips + per-post badge) and CreatePostScreen
// (tag picker). When adding a new tag, add it here and it shows up everywhere.

export type TagPalette = {
  backgroundColor: string;
  textColor: string;
};

export const TAG_STYLES: Record<string, TagPalette> = {
  General:      { backgroundColor: '#E8F7EC', textColor: '#218A4A' },
  Environment:  { backgroundColor: '#E7F0FF', textColor: '#2F6FEB' },
  Event:        { backgroundColor: '#EDE2FF', textColor: '#8A3FFC' },
  Workshop:     { backgroundColor: '#FFF0DC', textColor: '#B86A00' },
  Hazard:       { backgroundColor: '#FCE3E3', textColor: '#D93025' },
  'Mutual Aid': { backgroundColor: '#E6F8F4', textColor: '#117A65' },
  'Purple Air': { backgroundColor: '#F3E8FF', textColor: '#7C3AED' },
};

export const TAG_FALLBACK: TagPalette = {
  backgroundColor: '#F1F3F5',
  textColor: '#374151',
};

// All tags + an "All" sentinel for filter UIs. value === null means "no filter".
export const TAG_ITEMS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  ...Object.keys(TAG_STYLES).map((k) => ({ label: k, value: k })),
];

export const getTagPalette = (tag: string | null | undefined): TagPalette =>
  (tag && TAG_STYLES[tag]) || TAG_FALLBACK;
