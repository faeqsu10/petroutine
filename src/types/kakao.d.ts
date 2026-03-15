interface KakaoAuth {
  authorize(options: { redirectUri: string }): void;
}

interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Auth: KakaoAuth;
}

interface Window {
  Kakao: KakaoStatic;
}
