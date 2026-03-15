type BuildKakaoAuthorizeUrlParams = {
  restApiKey: string;
  redirectUri: string;
  prompt?: 'login' | 'select_account';
};

type StartKakaoLoginParams = {
  restApiKey?: string;
  currentOrigin: string;
  prompt?: 'login' | 'select_account';
  navigate?: (url: string) => void;
};

export function buildKakaoAuthorizeUrl({
  restApiKey,
  redirectUri,
  prompt = 'login',
}: BuildKakaoAuthorizeUrlParams): string {
  const authorizeUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', restApiKey);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('prompt', prompt);
  return authorizeUrl.toString();
}

export function startKakaoLogin({
  restApiKey,
  currentOrigin,
  prompt = 'login',
  navigate = (url) => window.location.assign(url),
}: StartKakaoLoginParams): void {
  if (!restApiKey) {
    throw new Error('Kakao REST API key is missing');
  }

  const redirectUri = `${currentOrigin}/api/auth/kakao/callback`;
  const authorizeUrl = buildKakaoAuthorizeUrl({
    restApiKey,
    redirectUri,
    prompt,
  });

  navigate(authorizeUrl);
}
