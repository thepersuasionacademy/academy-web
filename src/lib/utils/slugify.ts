export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

export function deslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')          // Replace - with space
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
} 