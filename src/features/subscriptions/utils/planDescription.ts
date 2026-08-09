/**
 * Split owner description into prose + bullet benefits.
 * Preserves line breaks and indentation in prose; blank lines stay.
 */
export function splitDescriptionAndBenefits(description: string): {
  description: string;
  benefits: string[];
} {
  const raw = description.replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const benefits: string[] = [];
  const proseLines: string[] = [];

  for (const line of lines) {
    const trimmedStart = line.trimStart();
    if (/^[•\-*]/.test(trimmedStart)) {
      benefits.push(trimmedStart.replace(/^[•\-*\s]+/, '').trim());
    } else {
      proseLines.push(line);
    }
  }

  const descriptionOut = proseLines
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');

  return {
    description: descriptionOut || raw.trim(),
    benefits: benefits.filter(Boolean),
  };
}

/** Rebuild textarea value from stored prose + benefits for edit hydrate. */
export function joinDescriptionAndBenefits(
  description: string,
  benefits: string[]
): string {
  const prose = description.trim();
  const bullets = benefits
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `• ${line}`)
    .join('\n');

  if (prose && bullets) return `${prose}\n${bullets}`;
  return prose || bullets;
}
