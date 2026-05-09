/**
 * Utility to convert Google Drive file IDs to direct view URLs.
 * Fallback is provided if the ID is missing.
 */

export function getDriveImageUrl(fileId: string): string {
  if (!fileId) return '/images/fallback.png';
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
