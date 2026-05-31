import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom doesn't implement these, but Radix UI primitives (Dialog, etc.) call
// them on mount. Stub them so component renders don't throw.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  const el = Element.prototype as unknown as Record<string, unknown>;
  if (!el.hasPointerCapture) el.hasPointerCapture = () => false;
  if (!el.setPointerCapture) el.setPointerCapture = () => {};
  if (!el.releasePointerCapture) el.releasePointerCapture = () => {};
  if (!el.scrollIntoView) el.scrollIntoView = () => {};

  if (!('ResizeObserver' in window)) {
    (window as unknown as Record<string, unknown>).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
