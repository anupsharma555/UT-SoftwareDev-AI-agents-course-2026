import '@testing-library/jest-dom'; // for custom matchers
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';
import { resetMockDatabase } from './mocks/mockData';
import { beforeAll, afterEach, afterAll } from 'vitest';

if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
}

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during tests
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockDatabase();
  globalThis.localStorage.clear();
});

// Clean up after tests are finished
afterAll(() => server.close());