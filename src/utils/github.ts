/**
 * Utility to guarantee all GitHub Pull Request and Repository links
 * resolve to valid, clickable external URLs that open properly.
 */
export function formatGithubPrUrl(url?: string, repo?: string, prNumber?: number): string {
  if (url) {
    const trimmed = url.trim();
    if (trimmed.startsWith('https://github.com/') || trimmed.startsWith('http://github.com/')) {
      return trimmed;
    }
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }
    // Clean redundant github.com prefix or leading slashes
    const cleanPath = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^github\.com\//i, '')
      .replace(/^\/+/, '');

    if (cleanPath.includes('/pull/')) {
      return `https://github.com/${cleanPath}`;
    }
    if (cleanPath) {
      return `https://github.com/${cleanPath}`;
    }
  }

  if (repo) {
    const cleanRepo = repo
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/pull\/\d+.*$/i, '')
      .replace(/^\/+|\/+$/g, '');

    if (prNumber && prNumber > 0) {
      return `https://github.com/${cleanRepo}/pull/${prNumber}`;
    }
    return `https://github.com/${cleanRepo}`;
  }

  return 'https://github.com';
}
