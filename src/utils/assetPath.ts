export function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL;

  if (path.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  return `${baseUrl}${path}`;
}
