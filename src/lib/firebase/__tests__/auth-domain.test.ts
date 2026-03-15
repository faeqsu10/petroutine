import { describe, expect, it } from 'vitest';
import {
  getFirebaseAuthDomainMismatch,
  getFirebaseAuthDomainMismatchMessage,
} from '@/lib/firebase/auth-domain';

describe('getFirebaseAuthDomainMismatch', () => {
  it('현재 앱 도메인과 authDomain이 같으면 null을 반환한다', () => {
    expect(
      getFirebaseAuthDomainMismatch('petroutine-ielc.vercel.app', 'petroutine-ielc.vercel.app'),
    ).toBeNull();
  });

  it('firebaseapp.com authDomain이면 mismatch를 반환한다', () => {
    expect(
      getFirebaseAuthDomainMismatch(
        'petroutine-2b8fd.firebaseapp.com',
        'petroutine-ielc.vercel.app',
      ),
    ).toEqual({
      configuredAuthDomain: 'petroutine-2b8fd.firebaseapp.com',
      currentHost: 'petroutine-ielc.vercel.app',
      usesFirebaseHostedDomain: true,
    });
  });

  it('프로토콜과 경로가 포함돼도 host만 비교한다', () => {
    expect(
      getFirebaseAuthDomainMismatch(
        'https://petroutine-ielc.vercel.app/__/auth/handler',
        'https://petroutine-ielc.vercel.app/login',
      ),
    ).toBeNull();
  });

  it('authDomain 또는 currentHost가 비어 있으면 null을 반환한다', () => {
    expect(getFirebaseAuthDomainMismatch('', 'petroutine-ielc.vercel.app')).toBeNull();
    expect(getFirebaseAuthDomainMismatch('petroutine-ielc.vercel.app', undefined)).toBeNull();
  });

  it('일반 커스텀 도메인 mismatch도 감지한다', () => {
    expect(
      getFirebaseAuthDomainMismatch('auth.example.com', 'app.example.com'),
    ).toEqual({
      configuredAuthDomain: 'auth.example.com',
      currentHost: 'app.example.com',
      usesFirebaseHostedDomain: false,
    });
  });
});

describe('getFirebaseAuthDomainMismatchMessage', () => {
  it('firebase hosted authDomain이면 same-site 안내 문구를 반환한다', () => {
    expect(
      getFirebaseAuthDomainMismatchMessage({
        configuredAuthDomain: 'petroutine-2b8fd.firebaseapp.com',
        currentHost: 'petroutine-ielc.vercel.app',
        usesFirebaseHostedDomain: true,
      }),
    ).toContain('same-site redirect 로그인을 위해 authDomain을 현재 앱 도메인으로 맞춰주세요.');
  });

  it('일반 mismatch면 일치하지 않는다는 문구를 반환한다', () => {
    expect(
      getFirebaseAuthDomainMismatchMessage({
        configuredAuthDomain: 'auth.example.com',
        currentHost: 'app.example.com',
        usesFirebaseHostedDomain: false,
      }),
    ).toContain('현재 앱 도메인(app.example.com)과 일치하지 않습니다.');
  });
});
