import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// localStorage 모킹
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// matchMedia 모킹 팩토리
function createMatchMedia(prefersDark: boolean) {
  return vi.fn((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// ---------------------------------------------------------------------------
// 테스트 대상 임포트 (모킹 설정 이후)
// ---------------------------------------------------------------------------
import { useTheme } from '../use-theme';

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------
describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    // classList 초기화
    document.documentElement.classList.remove('dark');
  });

  it('기본 테마는 light이다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
    });

    const { result } = renderHook(() => useTheme());
    // 초기 useState는 'light'
    expect(result.current.theme).toBe('light');
  });

  it('toggleTheme 호출 시 dark로 변경된다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
    });
    // localStorage에 저장된 테마 없음 → light에서 시작
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('localStorage에 테마가 저장된다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
    });
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('시스템 다크 모드 감지가 동작한다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(true),
      writable: true,
    });
    // localStorage에 저장된 값 없음 → 시스템 설정 따름
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    // useEffect 실행 후 dark로 설정되어야 함
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('localStorage에 저장된 테마가 시스템 설정보다 우선한다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(true), // 시스템은 dark
      writable: true,
    });
    // localStorage에 light 저장됨
    localStorageMock.getItem.mockReturnValue('light');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme 두 번 호출 시 원래 테마로 돌아온다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
    });
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); }); // light → dark
    act(() => { result.current.toggleTheme(); }); // dark → light

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme 호출 시 document.documentElement에 dark 클래스가 추가된다', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
    });
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
