import { describe, expect, it, vi } from 'vitest';
import { buildKakaoAuthorizeUrl, startKakaoLogin } from '@/lib/kakao-login';

describe('buildKakaoAuthorizeUrl', () => {
  it('카카오 로그인 URL에 prompt=login을 포함한다', () => {
    const url = new URL(buildKakaoAuthorizeUrl({
      restApiKey: 'test-kakao-key',
      redirectUri: 'https://petroutine-ielc.vercel.app/api/auth/kakao/callback',
    }));

    expect(url.origin).toBe('https://kauth.kakao.com');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('test-kakao-key');
    expect(url.searchParams.get('redirect_uri')).toBe('https://petroutine-ielc.vercel.app/api/auth/kakao/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('prompt')).toBe('login');
  });
});

describe('startKakaoLogin', () => {
  it('현재 origin 기준 redirect URI로 이동한다', () => {
    const navigate = vi.fn();

    startKakaoLogin({
      restApiKey: 'test-kakao-key',
      currentOrigin: 'https://petroutine-ielc.vercel.app',
      navigate,
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    const url = new URL(navigate.mock.calls[0][0]);
    expect(url.searchParams.get('redirect_uri')).toBe('https://petroutine-ielc.vercel.app/api/auth/kakao/callback');
    expect(url.searchParams.get('prompt')).toBe('login');
  });

  it('REST API 키가 없으면 에러를 던진다', () => {
    expect(() =>
      startKakaoLogin({
        currentOrigin: 'https://petroutine-ielc.vercel.app',
        navigate: vi.fn(),
      }),
    ).toThrow('Kakao REST API key is missing');
  });
});
