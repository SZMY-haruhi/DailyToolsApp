import Constants from 'expo-constants';

const GITHUB_REPO = 'SZMY-haruhi/DailyToolsApp';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes?: string;
  publishedAt?: string;
}

function normalizeVersion(version: string): string {
  return version.replace(/^v/i, '').trim();
}

function compareVersions(current: string, latest: string): boolean {
  const c = normalizeVersion(current).split('.').map(Number);
  const l = normalizeVersion(latest).split('.').map(Number);

  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cVal = c[i] || 0;
    const lVal = l[i] || 0;
    if (lVal > cVal) return true;
    if (lVal < cVal) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<VersionInfo> {
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch release info');
    }

    const data = await response.json();
    const latestVersion = data.tag_name || data.name || '1.0.0';
    const hasUpdate = compareVersions(currentVersion, latestVersion);

    return {
      currentVersion,
      latestVersion: normalizeVersion(latestVersion),
      hasUpdate,
      releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      releaseNotes: data.body || undefined,
      publishedAt: data.published_at || undefined,
    };
  } catch (error) {
    console.error('Version check failed:', error);
    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
    };
  }
}
