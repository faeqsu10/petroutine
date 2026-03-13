import { redirect } from 'next/navigation';

// MVP에서는 소셜 로그인만 지원 — 별도 회원가입 불필요
export default function SignupPage() {
  redirect('/login');
}
