import { describe, it, expect, beforeEach } from 'vitest';
import { isAllowedAdmin } from '../admin-access';

describe('isAllowedAdmin', () => {
  beforeEach(() => {
    process.env.ADMIN_UIDS = 'admin-uid,another-admin';
    process.env.ADMIN_EMAILS = 'admin@example.com,ops@example.com';
  });

  it('uid allowlist를 지원한다', () => {
    expect(isAllowedAdmin({ uid: 'admin-uid' })).toBe(true);
  });

  it('email allowlist를 지원한다', () => {
    expect(isAllowedAdmin({ email: 'ops@example.com' })).toBe(true);
  });

  it('일치하지 않으면 false를 반환한다', () => {
    expect(isAllowedAdmin({ uid: 'user-123', email: 'user@example.com' })).toBe(false);
  });
});
