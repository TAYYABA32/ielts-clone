/** Word-count rule shared by the candidate Writing UI (live counter) and the writing-submit API route (stored wordCount) so the two never disagree. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
