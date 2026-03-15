interface KakaoAuth {
  login(options: {
    success: (response: { access_token: string }) => void;
    fail: (error: unknown) => void;
  }): void;
}

interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Auth: KakaoAuth;
}

interface Window {
  Kakao: KakaoStatic;
}
