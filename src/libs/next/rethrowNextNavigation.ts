/**
 * Next.js `notFound()` / `redirect()` throw special errors. Route `try/catch`
 * blocks must rethrow them or they collapse into a 200 HTML page.
 */
export function rethrowNextNavigation(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string'
  ) {
    const digest = (error as { digest: string }).digest;
    if (
      digest.startsWith('NEXT_HTTP_ERROR_FALLBACK') ||
      digest.startsWith('NEXT_REDIRECT') ||
      digest.startsWith('NEXT_NOT_FOUND')
    ) {
      throw error;
    }
  }
}
