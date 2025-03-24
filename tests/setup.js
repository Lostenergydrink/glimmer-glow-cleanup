/**
 * Jest test setup file
 * 
 * This file is loaded before running tests to configure the test environment.
 */

// Mock browser APIs not available in JSDOM
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn()
  };
};

// Mock localStorage if not available
if (!global.localStorage) {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
}

// Mock window location
const originalLocation = window.location;
delete window.location;
window.location = {
  href: '',
  pathname: '/shop.html',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// Mock window.fetch
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: {
      get: jest.fn()
    }
  });
});

// Mock window.alert and window.confirm
window.alert = jest.fn();
window.confirm = jest.fn().mockImplementation(() => true);

// Mock custom event
global.CustomEvent = class CustomEvent extends Event {
  constructor(name, options = {}) {
    super(name, options);
    this.detail = options.detail || {};
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Cleanup after tests
afterAll(() => {
  window.location = originalLocation;
});

// Console warning suppression
const originalConsoleWarn = console.warn;
console.warn = jest.fn((...args) => {
  // Filter out specific warnings you want to ignore
  if (args[0] && args[0].includes('JSDOM does not support some features')) {
    return;
  }
  originalConsoleWarn(...args);
}); 