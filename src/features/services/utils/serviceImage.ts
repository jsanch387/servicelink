export function getServiceImagePath(
  service: { image_path?: string | null } | null | undefined
): string | null {
  const path = service?.image_path?.trim();
  return path || null;
}

export function serviceImageInitial(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'S';
}
