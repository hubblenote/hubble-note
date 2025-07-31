/**
 * Masks inline-code content with 'X' characters to prevent formatting regex
 * from matching across inline-code boundaries while preserving string length
 * for 1:1 position mapping.
 * 
 * @param text - The original text to mask
 * @returns The masked text with inline-code content replaced
 * 
 * @example
 * maskInlineCode("This is `code` and **bold**")
 * // Returns: "This is `XXXX` and **bold**"
 */
export function maskInlineCode(text: string): string {
  return text.replace(/`([^`]+)`/g, (match, content) => {
    return '`' + 'X'.repeat(content.length) + '`';
  });
}
