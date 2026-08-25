// Estimate reading time from a post's raw body. ~200 words/minute, min 1 min.
// `lang` defaults to 'en' so every existing call site keeps working unchanged.
// `min` is the same abbreviation in both languages; only the noun changes.
export function readingTime(body: string | undefined, lang: 'en' | 'fr' = 'en'): string {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return lang === 'fr' ? `${minutes} min de lecture` : `${minutes} min read`
}
