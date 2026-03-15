type FirebaseAuthDomainMismatch = {
  configuredAuthDomain: string;
  currentHost: string;
  usesFirebaseHostedDomain: boolean;
};

function normalizeHost(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).host.toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  }
}

export function getFirebaseAuthDomainMismatch(
  configuredAuthDomain?: string | null,
  currentHost?: string | null,
): FirebaseAuthDomainMismatch | null {
  const normalizedConfiguredAuthDomain = normalizeHost(configuredAuthDomain);
  const normalizedCurrentHost = normalizeHost(currentHost);

  if (!normalizedConfiguredAuthDomain || !normalizedCurrentHost) {
    return null;
  }

  if (normalizedConfiguredAuthDomain === normalizedCurrentHost) {
    return null;
  }

  return {
    configuredAuthDomain: normalizedConfiguredAuthDomain,
    currentHost: normalizedCurrentHost,
    usesFirebaseHostedDomain:
      normalizedConfiguredAuthDomain.endsWith('.firebaseapp.com') ||
      normalizedConfiguredAuthDomain.endsWith('.web.app'),
  };
}

export function getFirebaseAuthDomainMismatchMessage(
  mismatch: FirebaseAuthDomainMismatch,
): string {
  if (mismatch.usesFirebaseHostedDomain) {
    return `로그인 설정 오류: authDomain(${mismatch.configuredAuthDomain})이 현재 앱 도메인(${mismatch.currentHost})과 다릅니다. same-site redirect 로그인을 위해 authDomain을 현재 앱 도메인으로 맞춰주세요.`;
  }

  return `로그인 설정 오류: authDomain(${mismatch.configuredAuthDomain})이 현재 앱 도메인(${mismatch.currentHost})과 일치하지 않습니다.`;
}
